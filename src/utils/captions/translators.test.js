import {
  findProviders,
  getLanguage,
  httpProvider,
} from './translators';

describe('translators', () => {
  afterEach(() => {
    delete global.fetch;
  });

  it('reduces locales to languages', () => {
    expect(getLanguage('pt-BR')).toBe('pt');
    expect(getLanguage('en_US')).toBe('en');
    expect(getLanguage('AR')).toBe('ar');
  });

  const LANGUAGES = [
    { code: 'en', targets: ['ar', 'es', 'pt', 'zh-Hans'] },
    { code: 'es', targets: ['en'] },
    { code: 'ar', targets: ['en'] },
    { code: 'pt', targets: ['en'] },
    { code: 'pt-BR', targets: ['en'] },
    { code: 'zh-Hans', targets: ['en'] },
  ];

  const mockServer = (translate) => jest.fn((url) => Promise.resolve(url.endsWith('/languages')
    ? { ok: true, json: () => Promise.resolve(LANGUAGES) }
    : translate()));

  it('calls a LibreTranslate server', async () => {
    global.fetch = mockServer(() => ({
      ok: true,
      json: () => Promise.resolve({ translatedText: ['Hola', 'Adiós'] }),
    }));

    const translator = await httpProvider('https://mt.example.com/', 'secret').create('en', 'es');
    await expect(translator.translate(['Hello', 'Bye'])).resolves.toEqual(['Hola', 'Adiós']);

    const [url, options] = global.fetch.mock.calls[1];
    expect(global.fetch.mock.calls[0][0]).toBe('https://mt.example.com/languages');
    expect(url).toBe('https://mt.example.com/translate');
    expect(JSON.parse(options.body)).toEqual({
      api_key: 'secret',
      format: 'text',
      q: ['Hello', 'Bye'],
      source: 'en',
      target: 'es',
    });
  });

  it('works at the default address and uses the server language codes', async () => {
    global.fetch = mockServer(() => ({
      ok: true,
      json: () => Promise.resolve({ translatedText: ['你好'] }),
    }));

    const translator = await httpProvider('/playback/translate').create('en', 'zh');
    await translator.translate(['Hello']);

    expect(global.fetch.mock.calls[0][0]).toBe('/playback/translate/languages');
    const [url, options] = global.fetch.mock.calls[1];
    expect(url).toBe('/playback/translate/translate');
    expect(JSON.parse(options.body).target).toBe('zh-Hans');
  });

  it('offers only the pairs the server supports, asking once', async () => {
    global.fetch = mockServer();
    const provider = httpProvider('/playback/translate');

    await expect(provider.isAvailable('en', 'ar')).resolves.toBe(true);
    await expect(provider.isAvailable('en', 'pt')).resolves.toBe(true);
    await expect(provider.isAvailable('en', 'ja')).resolves.toBe(false);
    await expect(provider.isAvailable('ar', 'es')).resolves.toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('offers nothing when the server is missing', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 404 }));
    const provider = httpProvider('/playback/translate');

    await expect(provider.isAvailable('en', 'es')).resolves.toBe(false);
    await expect(provider.isAvailable('en', 'ar')).resolves.toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects failed or incomplete answers', async () => {
    global.fetch = mockServer(() => ({ ok: false, status: 503 }));
    const translator = await httpProvider('https://mt.example.com').create('en', 'es');
    await expect(translator.translate(['Hello'])).rejects.toThrow('503');

    global.fetch = mockServer(() => ({
      ok: true,
      json: () => Promise.resolve({ translatedText: ['Hola'] }),
    }));
    await expect(translator.translate(['Hello', 'Bye'])).rejects.toThrow('mismatch');
  });
});

describe('findProviders', () => {
  const provider = (name, languages) => ({
    name,
    isAvailable: jest.fn((source, target) => Promise.resolve(languages.includes(target))),
  });

  it('lists the providers that can translate the pair, best first', async () => {
    const browser = provider('browser', ['es']);
    const server = provider('http', ['es', 'ur']);

    await expect(findProviders([browser, server], 'en', 'es')).resolves.toEqual([browser, server]);
    await expect(findProviders([browser, server], 'en', 'ur')).resolves.toEqual([server]);
    await expect(findProviders([browser, server], 'en', 'xx')).resolves.toEqual([]);
  });

  it('skips a provider that fails', async () => {
    const broken = { isAvailable: () => { throw new Error('no'); } };
    const server = provider('http', ['es']);

    await expect(findProviders([broken, server], 'en', 'es')).resolves.toEqual([server]);
  });
});

describe('Chrome translator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.Translator = { availability: jest.fn(), create: jest.fn() };
  });

  afterEach(() => {
    jest.useRealTimers();
    delete window.Translator;
  });

  const getBrowserProvider = () => {
    const { getProviders } = jest.requireActual('./translators');

    return getProviders().find(provider => provider.name === 'browser');
  };

  it('comes before the server and the in-browser models', () => {
    const { getProviders } = jest.requireActual('./translators');

    expect(getProviders().map(provider => provider.name)).toEqual(['browser', 'http', 'local']);
  });

  it('counts as unavailable when it does not answer', async () => {
    window.Translator.availability.mockReturnValue(new Promise(() => {}));
    const available = getBrowserProvider().isAvailable('en', 'es');

    jest.advanceTimersByTime(3000);
    await expect(available).resolves.toBe(false);
  });

  it('gives up on a stalled download, but not on a slow one', async () => {
    let monitor;
    window.Translator.create.mockImplementation(options => {
      monitor = new EventTarget();
      options.monitor(monitor);

      return new Promise(() => {});
    });
    const created = getBrowserProvider().create('en', 'es');
    const failed = jest.fn();
    created.catch(failed);

    // Progress keeps it waiting
    jest.advanceTimersByTime(15000);
    monitor.dispatchEvent(Object.assign(new Event('downloadprogress'), { loaded: 0.5 }));
    jest.advanceTimersByTime(15000);
    await Promise.resolve();
    expect(failed).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);
    await expect(created).rejects.toThrow('timeout');
  });
});

describe('getTranslator', () => {
  const { getTranslator } = jest.requireActual('./translators');

  it('shares one translator per language pair and its progress', async () => {
    let report;
    const translator = { translate: jest.fn() };
    const provider = {
      create: jest.fn((source, target, onProgress) => {
        report = onProgress;
        return Promise.resolve(translator);
      }),
    };
    const first = jest.fn();
    const second = jest.fn();

    const a = getTranslator(provider, 'en', 'fr', first);
    report(0.5);
    const b = getTranslator(provider, 'en', 'fr', second);

    expect(provider.create).toHaveBeenCalledTimes(1);
    // A late caller still hears where the download is
    expect(second).toHaveBeenCalledWith(0.5);
    report(1);
    expect(first).toHaveBeenLastCalledWith(1);
    expect(second).toHaveBeenLastCalledWith(1);
    await expect(a).resolves.toBe(translator);
    await expect(b).resolves.toBe(translator);

    // Once ready, nobody keeps listening
    const late = jest.fn();
    await getTranslator(provider, 'en', 'fr', late);
    report(1);
    expect(late).not.toHaveBeenCalled();

    getTranslator(provider, 'en', 'de');
    expect(provider.create).toHaveBeenCalledTimes(2);
  });

  it('retries after a failure', async () => {
    const provider = {
      create: jest.fn()
        .mockImplementationOnce(() => Promise.reject(new Error('no')))
        .mockImplementationOnce(() => Promise.resolve('ok')),
    };

    await expect(getTranslator(provider, 'en', 'es')).rejects.toThrow('no');
    await expect(getTranslator(provider, 'en', 'es')).resolves.toBe('ok');
  });
});
