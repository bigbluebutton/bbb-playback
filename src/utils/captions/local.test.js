import { getSteps } from './local';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

describe('local translation models', () => {
  const userAgent = navigator.userAgent;

  const setDevice = (agent, maxTouchPoints = 0) => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: agent });
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: maxTouchPoints });
  };

  afterEach(() => setDevice(userAgent));

  it('uses one small model into or out of English', () => {
    expect(getSteps('en', 'es')).toEqual([{ model: 'Xenova/opus-mt-en-es', size: 115e6 }]);
    expect(getSteps('ar', 'en')).toEqual([{ model: 'Xenova/opus-mt-ar-en', size: 115e6 }]);
  });

  it('goes through English for other pairs', () => {
    expect(getSteps('ar', 'fr').map(step => step.model)).toEqual([
      'Xenova/opus-mt-ar-en',
      'Xenova/opus-mt-en-fr',
    ]);
  });

  it('tags lines for models with several target languages', () => {
    expect(getSteps('en', 'pt')).toEqual([{ model: 'Xenova/opus-mt-en-ROMANCE', prefix: '>>pt<<', size: 115e6 }]);
  });

  it('uses the multilingual model on computers for the other languages', () => {
    expect(getSteps('en', 'fa')).toEqual([{
      model: 'Xenova/m2m100_418M',
      options: { src_lang: 'en', tgt_lang: 'fa' },
      size: 640e6,
    }]);
    expect(getSteps('ar', 'ja')[0].model).toBe('Xenova/m2m100_418M');
  });

  it('keeps phones and tablets to the small models', () => {
    setDevice(IPHONE, 5);
    expect(getSteps('en', 'es')).toHaveLength(1);
    expect(getSteps('en', 'fa')).toBeNull();

    setDevice(IPAD, 5);
    expect(getSteps('ar', 'de')).toHaveLength(2);
    expect(getSteps('ar', 'ko')).toBeNull();
  });

  it('offers nothing for the same or unknown languages', () => {
    expect(getSteps('en', 'en')).toBeNull();
    expect(getSteps('en', 'xx')).toBeNull();
  });
});

describe('local translation worker', () => {
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));

  // Answers like public/translation-worker.js, a moment later
  class FakeWorker {
    constructor(url, options) {
      FakeWorker.instances.push(this);
      Object.assign(this, { listeners: { error: [], message: [] }, options, posted: [], url });
    }

    addEventListener(type, listener) {
      this.listeners[type].push(listener);
    }

    postMessage(message) {
      this.posted.push(message);
      const reply = (data) => setTimeout(() => this.listeners.message.forEach(listener => {
        listener({ data: { id: message.id, ...data } });
      }), 0);
      if (message.type === 'load') {
        reply({ loaded: 0.5, type: 'progress' });
        reply({ type: 'downloaded' });
        reply({ type: 'done' });
      } else {
        reply({ text: `${message.step.model.split('-').pop()}:${message.text}`, type: 'done' });
      }
    }

    fail(message) {
      this.listeners.error.forEach(listener => listener({ message, preventDefault: () => {} }));
    }

    terminate() {}
  }

  let localProvider;

  beforeEach(() => {
    FakeWorker.instances = [];
    window.Worker = FakeWorker;
    jest.isolateModules(() => {
      ({ localProvider } = require('./local'));
    });
  });

  afterEach(() => {
    delete window.Worker;
  });

  it('is offered when the browser can run it', async () => {
    await expect(localProvider.isAvailable('ar', 'fr')).resolves.toBe(true);
    delete window.Worker;
    await expect(localProvider.isAvailable('ar', 'fr')).resolves.toBe(false);
  });

  it('loads the models of a pair one after the other in one worker', async () => {
    const progress = [];
    await localProvider.create('ar', 'fr', (loaded) => progress.push(loaded));

    expect(FakeWorker.instances).toHaveLength(1);
    expect(FakeWorker.instances[0].options).toEqual({ type: 'module' });
    const [worker] = FakeWorker.instances;
    expect(worker.posted.map(message => `${message.type}:${message.step.model}`)).toEqual([
      'load:Xenova/opus-mt-ar-en',
      'load:Xenova/opus-mt-en-fr',
    ]);
    // The first model's download, then getting ready
    expect(progress).toEqual([0.5, 1]);
  });

  it('runs each line through every model of the pair', async () => {
    const translator = await localProvider.create('ar', 'fr');

    await expect(translator.translate(['مرحبا', 'شكرا'])).resolves.toEqual(['fr:en:مرحبا', 'fr:en:شكرا']);
  });

  it('fails what is waiting when the worker breaks, then starts a new one', async () => {
    const translator = await localProvider.create('ar', 'en');
    const [worker] = FakeWorker.instances;
    worker.postMessage = function (message) {
      this.posted.push(message);
    };

    const line = translator.translate(['مرحبا']);
    await flush();
    worker.fail('out of memory');
    await expect(line).rejects.toThrow('out of memory');

    await localProvider.create('ar', 'en');
    expect(FakeWorker.instances).toHaveLength(2);
  });
});
