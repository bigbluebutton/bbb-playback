import {
  restoreCaptionLanguage,
  watchCaptionLanguage,
} from './preference';
import {
  getCaptionPreference,
  saveCaptionPreference,
} from 'utils/preferences';

const createPlayer = (tracks) => {
  const target = new EventTarget();
  const list = tracks.map(([kind, language]) => ({ kind, language, mode: 'disabled' }));
  list.addEventListener = (type, listener) => target.addEventListener(type, listener);
  list.removeEventListener = (type, listener) => target.removeEventListener(type, listener);

  return {
    on: () => {},
    select(language) {
      list.forEach(track => {
        track.mode = track.language === language ? 'showing' : 'disabled';
      });
      target.dispatchEvent(new Event('change'));
    },
    showing: () => (list.find(track => track.mode === 'showing') || {}).language,
    textTracks: () => list,
  };
};

describe('caption language preference', () => {
  beforeEach(() => localStorage.clear());

  it('remembers the language picked in the CC menu, and off', () => {
    const player = createPlayer([['captions', 'ar'], ['subtitles', 'es']]);
    watchCaptionLanguage(player);

    player.select('es');
    expect(getCaptionPreference()).toBe('es');
    player.select(null);
    expect(getCaptionPreference()).toBe('off');
  });

  it('turns on the remembered language on the next visit', () => {
    saveCaptionPreference('es');
    const player = createPlayer([['captions', 'ar'], ['subtitles', 'es']]);

    restoreCaptionLanguage(player);

    expect(player.showing()).toBe('es');
  });

  it('prefers the recording’s own captions over a translation', () => {
    saveCaptionPreference('en');
    const player = createPlayer([['subtitles', 'en'], ['captions', 'en-US']]);

    restoreCaptionLanguage(player);

    expect(player.showing()).toBe('en-US');
  });

  it('leaves captions alone when off, unknown or already chosen', () => {
    saveCaptionPreference('off');
    const player = createPlayer([['captions', 'ar']]);
    restoreCaptionLanguage(player);
    expect(player.showing()).toBeUndefined();

    saveCaptionPreference('ja');
    restoreCaptionLanguage(player);
    expect(player.showing()).toBeUndefined();

    saveCaptionPreference('ar');
    const chosen = createPlayer([['captions', 'ar'], ['subtitles', 'es']]);
    chosen.select('es');
    restoreCaptionLanguage(chosen);
    expect(chosen.showing()).toBe('es');
  });
});
