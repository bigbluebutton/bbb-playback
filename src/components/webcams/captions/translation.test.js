import setupCaptionTranslation from './translation';
import { getProviders } from 'utils/captions/translators';

jest.mock('utils/data', () => ({ buildFileURL: (file) => `/recording/${file}` }));
jest.mock('utils/data/storage', () => ({
  captions: [{ locale: 'ar', localeName: 'العربية' }],
  metadata: { id: 'recording' },
}));
// Saved translations live in memory here
jest.mock('utils/captions/cache', () => {
  const saved = new Map();

  return {
    clear: () => saved.clear(),
    readTranslation: (key) => Promise.resolve(saved.get(key) || null),
    writeTranslation: (key, value) => {
      saved.set(key, JSON.parse(JSON.stringify(value)));

      return Promise.resolve();
    },
  };
});
jest.mock('utils/captions/translators', () => ({
  ...jest.requireActual('utils/captions/translators'),
  getProviders: jest.fn(),
}));

const VTT = `WEBVTT

00:00:00.000 --> 00:00:02.000
واحد

00:00:02.000 --> 00:00:04.000
اثنان

00:00:04.000 --> 00:00:06.000
ثلاثة
`;

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

// What setupCaptionTranslation uses of a video.js player
const createPlayer = () => {
  const target = new EventTarget();
  const tracks = [];
  tracks.addEventListener = (type, listener) => target.addEventListener(type, listener);
  tracks.removeEventListener = (type, listener) => target.removeEventListener(type, listener);

  const addTrack = (kind, label, language) => {
    const track = {
      cues: [],
      kind,
      label,
      language,
      mode: 'disabled',
      addCue(cue) { this.cues.push(cue); },
      removeCue(cue) { this.cues.splice(this.cues.indexOf(cue), 1); },
    };
    tracks.push(track);

    return track;
  };
  addTrack('captions', 'العربية', 'ar');

  return {
    addTextTrack: addTrack,
    currentTime: () => 0,
    getChild: () => ({ updateDisplay: () => {} }),
    isDisposed: () => false,
    off: () => {},
    on: () => {},
    textTracks: () => tracks,
    // Shows one track, as the CC menu does
    select(language) {
      tracks.forEach(track => {
        track.mode = track.language === language ? 'showing' : 'disabled';
      });
      target.dispatchEvent(new Event('change'));
    },
    track: (language) => tracks.find(track => track.language === language),
  };
};

let nextName = 0;
// A provider that translates into the given languages, with translate()
// controlling each line
const createProvider = (languages, translate, extra = {}) => ({
  batchSize: 1,
  concurrency: 1,
  create: jest.fn(() => Promise.resolve({ translate })),
  isAvailable: (source, target) => Promise.resolve(languages.includes(target)),
  name: `provider-${++nextName}`,
  ...extra,
});

const createCallbacks = () => ({
  label: 'auto-translated',
  locale: 'en',
  onFailed: jest.fn(),
  onHidden: jest.fn(),
  onPreparing: jest.fn(),
  onProgress: jest.fn(),
  onReady: jest.fn(),
  onStart: jest.fn(),
});

describe('caption translation', () => {
  beforeAll(() => {
    window.VTTCue = class {
      constructor(start, end, text) {
        Object.assign(this, { end, start, text });
      }
    };
  });

  beforeEach(() => {
    jest.requireMock('utils/captions/cache').clear();
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(VTT) }));
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('lists the languages a provider offers, besides the recording’s own', async () => {
    getProviders.mockReturnValue([createProvider(['ar', 'en', 'es'], async (texts) => texts)]);
    const player = createPlayer();

    await setupCaptionTranslation(player, createCallbacks());

    expect(player.textTracks().map(track => `${track.kind}:${track.language}`)).toEqual([
      'captions:ar',
      'subtitles:en',
      'subtitles:es',
    ]);
    expect(player.track('es').label).toBe('Spanish · auto-translated');
  });

  it('adds nothing without captions or providers', async () => {
    getProviders.mockReturnValue([]);
    const player = createPlayer();

    await setupCaptionTranslation(player, createCallbacks());

    expect(player.textTracks()).toHaveLength(1);
  });

  it('translates every line of the picked language and says so once', async () => {
    const translate = jest.fn(async (texts) => texts.map(text => `es:${text}`));
    getProviders.mockReturnValue([createProvider(['es'], translate)]);
    const player = createPlayer();
    const callbacks = createCallbacks();
    await setupCaptionTranslation(player, callbacks);

    player.select('es');
    await flush();
    await flush();

    expect(player.track('es').cues.map(cue => cue.text)).toEqual(['es:واحد', 'es:اثنان', 'es:ثلاثة']);
    expect(callbacks.onStart).toHaveBeenCalledWith('Spanish');
    expect(callbacks.onReady).toHaveBeenCalledTimes(1);
    expect(callbacks.onFailed).not.toHaveBeenCalled();
  });

  it('shows download progress, then that the captions are getting ready', async () => {
    const provider = createProvider(['es'], async (texts) => texts);
    provider.create = jest.fn(async (source, target, onProgress) => {
      await flush();
      onProgress(0.42);
      onProgress(1);

      return { translate: async (texts) => texts };
    });
    getProviders.mockReturnValue([provider]);
    const player = createPlayer();
    const callbacks = createCallbacks();
    await setupCaptionTranslation(player, callbacks);

    player.select('es');
    await flush();
    await flush();

    expect(callbacks.onProgress).toHaveBeenCalledWith('Spanish', 40);
    expect(callbacks.onPreparing).toHaveBeenCalledWith('Spanish');
  });

  it('carries on with the next provider when one fails', async () => {
    const broken = createProvider(['es'], jest.fn(() => Promise.reject(new Error('stalled'))));
    const server = createProvider(['es'], async (texts) => texts.map(text => `server:${text}`));
    getProviders.mockReturnValue([broken, server]);
    const player = createPlayer();
    const callbacks = createCallbacks();
    await setupCaptionTranslation(player, callbacks);

    player.select('es');
    await flush();
    await flush();

    expect(player.track('es').cues.every(cue => cue.text.startsWith('server:'))).toBe(true);
    expect(callbacks.onFailed).not.toHaveBeenCalled();
  });

  it('goes back to the original captions when every provider fails', async () => {
    getProviders.mockReturnValue([createProvider(['es'], () => Promise.reject(new Error('down')))]);
    const player = createPlayer();
    const callbacks = createCallbacks();
    await setupCaptionTranslation(player, callbacks);

    player.select('es');
    await flush();
    await flush();

    expect(callbacks.onFailed).toHaveBeenCalledWith('Spanish');
    expect(player.track('es').mode).toBe('disabled');
    expect(player.track('ar').mode).toBe('showing');
  });

  it('pauses a language the viewer leaves and resumes it when picked again', async () => {
    let release;
    const translate = jest.fn((texts) => new Promise(resolve => {
      release = () => resolve(texts.map(text => `es:${text}`));
    }));
    getProviders.mockReturnValue([createProvider(['es'], translate)]);
    const player = createPlayer();
    const callbacks = createCallbacks();
    await setupCaptionTranslation(player, callbacks);

    player.select('es');
    await flush();
    expect(translate).toHaveBeenCalledTimes(1);

    // Back to the original: the line in flight lands, nothing more is asked
    player.select('ar');
    expect(callbacks.onHidden).toHaveBeenCalled();
    release();
    await flush();
    await flush();
    expect(translate).toHaveBeenCalledTimes(1);

    player.select('es');
    for (let line = 0; line < 2; line++) {
      await flush();
      release();
      await flush();
    }
    expect(player.track('es').cues.map(cue => cue.text)).toEqual(['es:واحد', 'es:اثنان', 'es:ثلاثة']);
  });
});
