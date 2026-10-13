import {
  getAttempts,
  playFirstWorking,
} from './fallback';
import { registerOgvTech } from './ogv';

jest.mock('./ogv', () => ({
  ...jest.requireActual('./ogv'),
  registerOgvTech: jest.fn(),
}));

const MP4 = { src: 'webcams.mp4', type: 'video/mp4' };
const WEBM = { src: 'webcams.webm', type: 'video/webm' };

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

// What playFirstWorking uses of a video.js player
const createPlayer = () => {
  const listeners = {};
  const player = {
    classes: new Set(),
    current: null,
    error_: null,
    options_: { techOrder: ['html5'] },
    ready: 0,
    tried: [],
    addClass: (name) => player.classes.add(name),
    removeClass: (name) => player.classes.delete(name),
    error(value) {
      if (value === undefined) return player.error_;
      player.error_ = value;
      if (value) (listeners.error || []).forEach(listener => listener());

      return undefined;
    },
    isDisposed: () => false,
    on: (type, listener) => {
      listeners[type] = [...(listeners[type] || []), listener];
    },
    readyState: () => player.ready,
    src(source) {
      player.current = source;
      player.tried.push(`${player.options_.techOrder[0]}:${source.type}`);
    },
    trigger: (type) => (listeners[type] || []).forEach(listener => listener()),
  };

  return player;
};

describe('media fallback', () => {
  beforeEach(() => {
    registerOgvTech.mockImplementation(() => Promise.resolve('ogvjs'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('tries MP4, then WebM, then WebM in the page decoder', () => {
    expect(getAttempts([MP4, WEBM]).map(({ source, tech }) => `${tech}:${source.type}`)).toEqual([
      'html5:video/mp4',
      'html5:video/webm',
      'ogvjs:video/webm',
    ]);
    expect(getAttempts([MP4]).map(({ tech }) => tech)).toEqual(['html5']);
  });

  it('moves on when the browser cannot play a file', async () => {
    const player = createPlayer();
    playFirstWorking(player, {}, [WEBM]);
    await flush();
    expect(player.tried).toEqual(['html5:video/webm']);

    // Safari: "The media could not be loaded…"
    player.error({ code: 4 });
    await flush();

    expect(registerOgvTech).toHaveBeenCalled();
    expect(player.tried).toEqual(['html5:video/webm', 'ogvjs:video/webm']);
    expect(player.error()).toBe(null);
  });

  it('keeps the error hidden while it tries, and shows it once it is out of options', async () => {
    const player = createPlayer();
    playFirstWorking(player, {}, [MP4], { message: 'Cannot play here' });
    await flush();

    player.error({ code: 4 });
    await flush();

    expect(player.classes.has('vjs-media-retry')).toBe(false);
    expect(player.error()).toEqual({ code: 4, message: 'Cannot play here' });
  });

  it('gives the page decoder a time limit, as it reports no errors', async () => {
    jest.useFakeTimers();
    const player = createPlayer();
    playFirstWorking(player, {}, [WEBM], { message: 'Cannot play here' });
    await Promise.resolve();
    player.error({ code: 4 });
    await Promise.resolve();
    await Promise.resolve();
    expect(player.tried).toEqual(['html5:video/webm', 'ogvjs:video/webm']);

    jest.advanceTimersByTime(30000);
    expect(player.error()).toEqual({ code: 4, message: 'Cannot play here' });
  });

  it('leaves a working page decoder alone', async () => {
    jest.useFakeTimers();
    const player = createPlayer();
    playFirstWorking(player, {}, [WEBM]);
    await Promise.resolve();
    player.error({ code: 4 });
    await Promise.resolve();
    await Promise.resolve();

    player.ready = 1;
    player.trigger('loadedmetadata');
    jest.advanceTimersByTime(30000);

    expect(player.error()).toBe(null);
  });

  it('ignores errors that another file would not fix', async () => {
    const player = createPlayer();
    playFirstWorking(player, {}, [MP4, WEBM]);
    await flush();

    // Aborted by the viewer
    player.error({ code: 1 });
    await flush();

    expect(player.tried).toEqual(['html5:video/mp4']);
  });
});
