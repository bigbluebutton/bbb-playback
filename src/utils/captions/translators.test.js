import {
  findProviders,
  getLanguage,
} from './translators';

describe('translators', () => {
  it('reduces locales to languages', () => {
    expect(getLanguage('pt-BR')).toBe('pt');
    expect(getLanguage('en_US')).toBe('en');
    expect(getLanguage('AR')).toBe('ar');
  });
});

describe('findProviders', () => {
  const provider = (name, languages) => ({
    name,
    isAvailable: jest.fn((source, target) => Promise.resolve(languages.includes(target))),
  });

  it('lists the providers that can translate the pair, best first', async () => {
    const browser = provider('browser', ['es']);
    const local = provider('local', ['es', 'ur']);

    await expect(findProviders([browser, local], 'en', 'es')).resolves.toEqual([browser, local]);
    await expect(findProviders([browser, local], 'en', 'ur')).resolves.toEqual([local]);
    await expect(findProviders([browser, local], 'en', 'xx')).resolves.toEqual([]);
  });

  it('skips a provider that fails', async () => {
    const broken = { isAvailable: () => { throw new Error('no'); } };
    const local = provider('local', ['es']);

    await expect(findProviders([broken, local], 'en', 'es')).resolves.toEqual([local]);
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

  it('comes before the in-browser models', () => {
    const { getProviders } = jest.requireActual('./translators');

    expect(getProviders().map(provider => provider.name)).toEqual(['browser', 'local']);
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
