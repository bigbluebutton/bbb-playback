import { captions as config } from 'config';

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
        return fetch(`${base}/translate`, {
          body: JSON.stringify({
            api_key: key || undefined,
            format: 'text',
            q: texts,
            source: map.has(source) ? map.get(source).code : source,
            target: map.has(target) ? map.get(target).code : target,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        }).then(response => {
          if (!response.ok) throw new Error(`translate ${response.status}`);

          return response.json();
        }).then(({ translatedText }) => {
          const result = Array.isArray(translatedText) ? translatedText : [translatedText];
          if (result.length !== texts.length) throw new Error('translate mismatch');

          return result;
        });
      },
    })),
  };
};

// Chrome's on-device translator comes first (private, no server load); the
// server covers every other browser and the languages Chrome lacks
const getProviders = () => {
  const { translate } = config;
  if (!translate || !translate.enabled) return [];

  const providers = [];
  if (window.Translator && typeof window.Translator.create === 'function') providers.push(browserProvider);
  if (translate.url) providers.push(httpProvider(translate.url, translate.key));

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
