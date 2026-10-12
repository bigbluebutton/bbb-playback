import { captions as config } from 'config';

// Translation on the viewer's device in any browser, with open translation
// models run by public/translation-worker.js: nothing to install, and the
// captions never leave the device. Models download once (about 110 MB per
// step) and stay in the browser cache

const OPUS = 'Xenova/opus-mt-';
// Download sizes, for progress when the model host does not send them
const OPUS_SIZE = 115e6;
const MULTILINGUAL_SIZE = 640e6;
// Small models into and out of English; other pairs go through English
const TO_ENGLISH = {
  ar: 'ar-en',
  de: 'de-en',
  es: 'es-en',
  fr: 'fr-en',
  hi: 'hi-en',
  id: 'id-en',
  it: 'it-en',
  ja: 'ja-en',
  ko: 'ko-en',
  nl: 'nl-en',
  pt: 'ROMANCE-en',
  ru: 'ru-en',
  tr: 'tr-en',
  uk: 'uk-en',
  zh: 'zh-en',
};
const FROM_ENGLISH = {
  ar: 'en-ar',
  de: 'en-de',
  es: 'en-es',
  fr: 'en-fr',
  hi: 'en-hi',
  id: 'en-id',
  it: 'en-it',
  nl: 'en-nl',
  // One model for several languages, told which one by a leading tag
  pt: ['en-ROMANCE', '>>pt<<'],
  ru: 'en-ru',
  uk: 'en-uk',
  zh: 'en-zh',
};

// One larger model (about 630 MB) for the languages without small ones
// (Persian, Japanese, Korean, Turkish, Urdu…), on computers only
const MULTILINGUAL = 'Xenova/m2m100_418M';
const MULTILINGUAL_LANGUAGES = [
  'ar', 'de', 'en', 'es', 'fa', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'nl', 'pt', 'ru', 'tr', 'uk', 'ur', 'zh',
];

// Without download progress for this long, loading gives up
const LOAD_TIMEOUT = 120000;
const LINE_TIMEOUT = 60000;

const toStep = (entry) => {
  const [name, prefix] = Array.isArray(entry) ? entry : [entry];

  const step = { model: OPUS + name, size: OPUS_SIZE };

  return prefix ? { ...step, prefix } : step;
};

const isComputer = () => {
  const { maxTouchPoints = 0, userAgent = '' } = navigator;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) return false;
  // iPads ask for the desktop site with a Mac user agent
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return false;
  if (navigator.deviceMemory && navigator.deviceMemory < 4) return false;

  return true;
};

const getSteps = (source, target) => {
  if (source === target) return null;

  const out = source === 'en' ? [] : TO_ENGLISH[source] && [toStep(TO_ENGLISH[source])];
  const into = target === 'en' ? [] : FROM_ENGLISH[target] && [toStep(FROM_ENGLISH[target])];
  if (out && into) return [...out, ...into];

  const large = MULTILINGUAL_LANGUAGES.includes(source) && MULTILINGUAL_LANGUAGES.includes(target);
  if (large && isComputer()) {
    return [{
      model: MULTILINGUAL,
      options: { src_lang: source, tgt_lang: target },
      size: MULTILINGUAL_SIZE,
    }];
  }

  return null;
};

const isSupported = () => {
  const { local } = config.translate || {};

  return Boolean(local && local.enabled && local.library)
    && typeof window.Worker === 'function'
    && typeof window.WebAssembly === 'object';
};

let worker = null;
let lastId = 0;
const requests = new Map();

const failAll = (error) => {
  requests.forEach(({ reject }) => reject(error));
  requests.clear();
  worker = null;
};

const getWorker = () => {
  if (!worker) {
    worker = new Worker(`${process.env.PUBLIC_URL}/translation-worker.js`, { type: 'module' });
    worker.addEventListener('message', ({ data }) => {
      const request = requests.get(data.id);
      if (!request) return;

      if (data.type === 'progress') {
        request.onProgress(data.loaded);
      } else if (data.type === 'done') {
        requests.delete(data.id);
        request.resolve(data.text);
      } else if (data.type === 'error') {
        requests.delete(data.id);
        request.reject(new Error(data.message));
      }
    });
    // Browsers without module workers, or a broken library download
    worker.addEventListener('error', (event) => {
      event.preventDefault();
      worker.terminate();
      failAll(new Error(event.message || 'translation worker'));
    });
  }

  return worker;
};

// Rejects after `timeout` without an answer; progress restarts the wait
const send = (message, timeout, onProgress = () => {}) => new Promise((resolve, reject) => {
  const id = ++lastId;
  let timer = null;
  const restart = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      requests.delete(id);
      reject(new Error('timeout'));
    }, timeout);
  };
  const settle = (callback) => (value) => {
    clearTimeout(timer);
    callback(value);
  };

  requests.set(id, {
    onProgress: (loaded) => {
      restart();
      onProgress(loaded);
    },
    reject: settle(reject),
    resolve: settle(resolve),
  });
  restart();

  try {
    getWorker().postMessage({ ...message, id, settings: config.translate.local });
  } catch (error) {
    requests.delete(id);
    settle(reject)(error);
  }
});

const localProvider = {
  name: 'local',
  // One line at a time, one model run at a time
  batchSize: 1,
  concurrency: 1,
  // Too large to download before the viewer asks for it
  preload: false,
  isAvailable: (source, target) => Promise.resolve(isSupported() && getSteps(source, target) !== null),
  create: (source, target, onProgress) => {
    const steps = getSteps(source, target);

    return send({ steps, type: 'load' }, LOAD_TIMEOUT, onProgress).then(() => ({
      translate: async (texts) => {
        const result = [];
        for (const text of texts) {
          result.push(await send({ steps, text, type: 'translate' }, LINE_TIMEOUT));
        }

        return result;
      },
    }));
  },
};

export {
  getSteps,
  localProvider,
};
