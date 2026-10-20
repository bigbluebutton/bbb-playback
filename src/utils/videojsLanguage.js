import logger from './logger';

const cache = {};

// video.js names its translations like pt-BR, zh-CN or ar
const getCandidates = (locale = '') => {
  const [language, region] = locale.split(/[-_]/);
  if (!language) return [];

  const candidates = [];
  if (region) candidates.push(`${language.toLowerCase()}-${region.toUpperCase()}`);
  candidates.push(language.toLowerCase());
  if (language === 'pt') candidates.push('pt-PT');
  if (language === 'zh') candidates.push('zh-CN');

  return [...new Set(candidates)];
};

const tryLoad = (candidates) => {
  if (candidates.length === 0) return Promise.resolve(null);

  const [code, ...rest] = candidates;

  return import(
    /* webpackChunkName: "vjs-lang-[request]" */
    `video.js/dist/lang/${code}.json`
  ).then(module => ({
    code,
    translations: module.default || module,
  })).catch(() => tryLoad(rest));
};

// Resolves the video.js translations for a locale, or null for English and
// unsupported languages. Never rejects
const loadVideojsLanguage = (locale) => {
  const candidates = getCandidates(locale);
  if (candidates.length === 0 || candidates[candidates.length - 1] === 'en') {
    return Promise.resolve(null);
  }

  const key = candidates.join('|');
  if (!cache[key]) {
    cache[key] = tryLoad(candidates).catch(error => {
      logger.warn('videojs', 'language', error);
      return null;
    });
  }

  return cache[key];
};

export {
  getCandidates,
  loadVideojsLanguage,
};
