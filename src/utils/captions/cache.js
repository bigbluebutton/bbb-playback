import logger from 'utils/logger';

const CACHE_NAME = 'bbb-playback-captions';

// Translated captions are kept with the Cache API (HTTPS only), so coming
// back to a language, or to the recording later, is instant
const toRequest = (key) => new Request(`${window.location.origin}/__bbb-playback-captions/${encodeURIComponent(key)}`);

const isAvailable = () => typeof window !== 'undefined' && 'caches' in window;

const readTranslation = async (key) => {
  if (!isAvailable()) return null;

  try {
    const cache = await window.caches.open(CACHE_NAME);
    const response = await cache.match(toRequest(key));

    return response ? await response.json() : null;
  } catch (error) {
    logger.warn('captions', 'cache read', error);
    return null;
  }
};

const writeTranslation = async (key, value) => {
  if (!isAvailable()) return;

  try {
    const cache = await window.caches.open(CACHE_NAME);
    await cache.put(toRequest(key), new Response(JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch (error) {
    logger.warn('captions', 'cache write', error);
  }
};

export {
  readTranslation,
  writeTranslation,
};
