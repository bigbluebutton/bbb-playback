import { files } from 'config';
import { ERROR } from 'utils/constants';

const MISSING = { ok: false, status: 404 };

// Fresh storage module per test: it keeps the fetched data in module state
const loadStorage = () => {
  let storage;
  jest.isolateModules(() => {
    storage = require('./storage').default;
  });

  return storage;
};

// fetch mock where each response is released by hand, in any order
const deferredFetch = () => {
  const pending = {};
  global.fetch = jest.fn((url, options = {}) => new Promise((resolve, reject) => {
    const key = `${options.method || 'GET'} ${url.split('/').slice(-2).join('/')}`;
    pending[key] = { resolve, reject };
  }));

  return pending;
};

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const fileKey = (file) => `GET rec/${file}`;

describe('storage', () => {
  afterEach(() => {
    delete global.fetch;
  });

  it('waits for the last file after the media probe', async () => {
    const pending = deferredFetch();
    const storage = loadStorage();
    const onLoaded = jest.fn();
    storage.fetch('rec', jest.fn(), onLoaded, jest.fn());

    const names = Object.values(files);
    const last = names.pop();
    names.forEach(file => pending[fileKey(file)].resolve(MISSING));
    pending['HEAD video/webcams.mp4'].resolve({ ok: true, url: 'rec/video/webcams.mp4' });
    pending['HEAD video/webcams.webm'].resolve(MISSING);
    await flush();

    expect(onLoaded).not.toHaveBeenCalled();

    pending[fileKey(last)].resolve(MISSING);
    await flush();

    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('waits for the media probe after the last file', async () => {
    const pending = deferredFetch();
    const storage = loadStorage();
    const onLoaded = jest.fn();
    storage.fetch('rec', jest.fn(), onLoaded, jest.fn());

    Object.values(files).forEach(file => pending[fileKey(file)].resolve(MISSING));
    await flush();

    expect(onLoaded).not.toHaveBeenCalled();

    pending['HEAD video/webcams.mp4'].resolve({ ok: true, url: 'rec/video/webcams.mp4' });
    pending['HEAD video/webcams.webm'].resolve(MISSING);
    await flush();

    expect(onLoaded).toHaveBeenCalledTimes(1);
    expect(storage.media).toEqual(['mp4']);
  });

  it('keeps the format of a redirected probe', async () => {
    const pending = deferredFetch();
    const storage = loadStorage();
    storage.fetch('rec', jest.fn(), jest.fn(), jest.fn());

    Object.values(files).forEach(file => pending[fileKey(file)].resolve(MISSING));
    pending['HEAD video/webcams.mp4'].resolve({ ok: true, url: 'https://cdn/webcams.mp4?signature=x' });
    pending['HEAD video/webcams.webm'].resolve(MISSING);
    await flush();

    expect(storage.media).toEqual(['mp4']);
  });

  it('keeps the formats whose probe did not fail', async () => {
    const pending = deferredFetch();
    const storage = loadStorage();
    const onLoaded = jest.fn();
    const onError = jest.fn();
    storage.fetch('rec', jest.fn(), onLoaded, onError);

    Object.values(files).forEach(file => pending[fileKey(file)].resolve(MISSING));
    pending['HEAD video/webcams.mp4'].resolve({ ok: true, url: 'rec/video/webcams.mp4' });
    pending['HEAD video/webcams.webm'].reject(new TypeError('Failed to fetch'));
    await flush();

    expect(onError).not.toHaveBeenCalled();
    expect(onLoaded).toHaveBeenCalledTimes(1);
    expect(storage.media).toEqual(['mp4']);
  });

  it('reports an error when every media probe fails', async () => {
    const pending = deferredFetch();
    const storage = loadStorage();
    const onError = jest.fn();
    storage.fetch('rec', jest.fn(), jest.fn(), onError);

    pending['HEAD video/webcams.mp4'].reject(new TypeError('Failed to fetch'));
    pending['HEAD video/webcams.webm'].reject(new TypeError('Failed to fetch'));
    await flush();
    pending['HEAD audio/audio.webm'].reject(new TypeError('Failed to fetch'));
    await flush();

    expect(onError).toHaveBeenCalledWith(ERROR.NOT_FOUND);
  });
});
