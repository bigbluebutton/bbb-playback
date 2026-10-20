import { captions as config } from 'config';
import { localProvider } from './local';

const getLanguage = (code = '') => code.split(/[-_]/)[0].toLowerCase();

// Some Chrome builds expose the translator but never answer (component not
// installed yet, turned off by policy), so every wait has a limit
const AVAILABILITY_TIMEOUT = 3000;
// Restarted by each download progress report
const CREATE_TIMEOUT = 20000;
const LINE_TIMEOUT = 15000;

const createTimeout = (ms) => {
  let timer = null;
  let fail = null;
  const promise = new Promise((resolve, reject) => {
    fail = reject;
  });
  const restart = () => {
    clearTimeout(timer);
    timer = setTimeout(() => fail(new Error('timeout')), ms);
  };
  restart();

  return {
    promise,
    restart,
    stop: () => clearTimeout(timer),
  };
};

const limit = (promise, ms) => {
  const timeout = createTimeout(ms);

  return Promise.race([promise, timeout.promise]).finally(timeout.stop);
};

// Chrome's on-device Translator API: free, private, no server needed
const browserProvider = {
  name: 'browser',
  isAvailable: (source, target) => {
    const availability = window.Translator.availability({
      sourceLanguage: source,
      targetLanguage: target,
    });

    return limit(availability, AVAILABILITY_TIMEOUT)
      .then(result => result !== 'unavailable')
      .catch(() => false);
  },
  // Language packs are worth fetching ahead of time
  preload: true,
  // Line by line, a few lines at a time
  batchSize: 1,
  concurrency: 4,
  create: (source, target, onProgress = () => {}) => {
    const timeout = createTimeout(CREATE_TIMEOUT);
    const created = window.Translator.create({
      sourceLanguage: source,
      targetLanguage: target,
      // Reports the language pack download, the first time a pair is used
      monitor: (monitor) => {
        monitor.addEventListener('downloadprogress', (event) => {
          timeout.restart();
          onProgress(event.loaded);
        });
      },
    });

    return Promise.race([created, timeout.promise]).finally(timeout.stop).then(translator => ({
      translate: async (texts) => {
        const result = [];
        for (const text of texts) {
          result.push(await limit(translator.translate(text), LINE_TIMEOUT));
        }

        return result;
      },
    }));
  },
};

// One id per page, so the server can hold this viewer to one language at a
// time while it gets ready (translate/gateway.py), like the CC menu does
const createViewerId = () => {
  const bytes = new Uint8Array(12);
  if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
    window.crypto.getRandomValues(bytes);
  } else {
    bytes.forEach((value, index) => { bytes[index] = Math.floor(Math.random() * 256); });
  }

  return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
};

const VIEWER_ID = createViewerId();

// The server asks to wait (another language is getting ready, or too many
// requests at once) for at most this many tries, as long as it says
const RETRY_STATUSES = [409, 429, 503];
const RETRY_TRIES = 30;
const RETRY_DEFAULT = 2;
const RETRY_LONGEST = 10;

const getRetryDelay = (response) => {
  const seconds = parseFloat(response.headers && response.headers.get('Retry-After'));
  const delay = Number.isFinite(seconds) ? seconds : RETRY_DEFAULT;

  return Math.min(Math.max(delay, .5), RETRY_LONGEST) * 1000;
};

// The viewer id goes to our own server only: another site may refuse
// unknown headers from other origins
const isSameOrigin = (base) => {
  try {
    return new URL(base, window.location.href).origin === window.location.origin;
  } catch (error) {
    return false;
  }
};

// A LibreTranslate server (or any compatible one) at `url`, e.g.
// /playback/translate or https://translate.example.com
const httpProvider = (url, key) => {
  const base = url.replace(/\/+$/, '');
  let languages = null;

  // The languages the server offers, asked once per page. Servers name some
  // languages with a script or region (zh-Hans, pt-BR); requests use those
  const getLanguages = () => {
    if (!languages) {
      languages = fetch(`${base}/languages`).then(response => {
        if (!response.ok) throw new Error(`languages ${response.status}`);

        return response.json();
      }).then(list => {
        const map = new Map();
        list.forEach(({ code, targets }) => {
          const language = getLanguage(code);
          const entry = map.get(language);
          // Prefer the plain code (pt over pt-BR) when a server lists both
          if (!entry || code === language) {
            map.set(language, {
              code,
              targets: Array.isArray(targets) ? new Set(targets.map(getLanguage)) : null,
            });
          }
        });

        return map;
      }).catch(() => new Map());
    }

    return languages;
  };

  return {
    name: 'http',
    batchSize: 16,
    concurrency: 3,
    isAvailable: (source, target) => getLanguages().then(map => {
      const from = map.get(source);
      if (!from || !map.has(target)) return false;

      // Older servers do not list targets: every pair works through English
      return from.targets ? from.targets.has(target) : true;
    }),
    create: (source, target) => getLanguages().then(map => ({
      translate: (texts) => {
        const headers = { 'Content-Type': 'application/json' };
        if (isSameOrigin(base)) headers['X-Playback-Viewer'] = VIEWER_ID;
        const body = JSON.stringify({
          api_key: key || undefined,
          format: 'text',
          q: texts,
          source: map.has(source) ? map.get(source).code : source,
          target: map.has(target) ? map.get(target).code : target,
        });

        const request = (tries) => fetch(`${base}/translate`, { body, headers, method: 'POST' }).then(response => {
          if (RETRY_STATUSES.includes(response.status) && tries < RETRY_TRIES) {
            return new Promise(resolve => setTimeout(resolve, getRetryDelay(response)))
              .then(() => request(tries + 1));
          }
          if (!response.ok) throw new Error(`translate ${response.status}`);

          return response.json();
        });

        return request(0).then(({ translatedText }) => {
          const result = Array.isArray(translatedText) ? translatedText : [translatedText];
          if (result.length !== texts.length) throw new Error('translate mismatch');

          return result;
        });
      },
    })),
  };
};

// Best first: Chrome's on-device translator (private, no download from us),
// then the server (fast on any device), then open models run in the
// viewer's browser, which work everywhere with nothing to install
const getProviders = () => {
  const { translate } = config;
  if (!translate || !translate.enabled) return [];

  const providers = [];
  if (window.Translator && typeof window.Translator.create === 'function') providers.push(browserProvider);
  if (translate.url) providers.push(httpProvider(translate.url, translate.key));
  if (translate.local && translate.local.enabled) providers.push(localProvider);

  return providers;
};

// The providers able to translate the pair, best first
const findProviders = (providers, source, target) => {
  return Promise.all(providers.map(provider => {
    return Promise.resolve()
      .then(() => provider.isAvailable(source, target))
      .then(available => (available ? provider : null), () => null);
  })).then(found => found.filter(Boolean));
};

// One translator per language pair, shared by everything that needs it: a
// background warm-up and the viewer's choice reuse the same download, and
// every caller hears about its progress
const translators = new Map();

const getTranslator = (provider, source, target, onProgress) => {
  const key = `${provider.name}|${source}|${target}`;
  let entry = translators.get(key);

  if (!entry) {
    const created = { listeners: new Set(), loaded: null, settled: false };
    created.promise = provider.create(source, target, (loaded) => {
      created.loaded = loaded;
      created.listeners.forEach(listener => listener(loaded));
    });
    // Progress only matters while the language pack downloads
    created.promise.then(() => {
      created.settled = true;
      created.listeners.clear();
    }, () => {
      created.settled = true;
      created.listeners.clear();
      translators.delete(key);
    });
    translators.set(key, created);
    entry = created;
  }

  if (onProgress && !entry.settled) {
    entry.listeners.add(onProgress);
    if (entry.loaded !== null) onProgress(entry.loaded);
  }

  return entry.promise;
};

export {
  findProviders,
  getLanguage,
  getProviders,
  getTranslator,
  httpProvider,
};
