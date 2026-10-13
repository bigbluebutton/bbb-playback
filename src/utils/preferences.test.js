import {
  getCaptionPreference,
  getMediaPreferences,
  saveCaptionPreference,
  saveMediaPreferences,
} from './preferences';

const RATES = [0.5, 1, 1.5, 2];

describe('media preferences', () => {
  beforeEach(() => localStorage.clear());

  it('has no preferences by default', () => {
    expect(getMediaPreferences(RATES)).toEqual({ muted: false, rate: null, volume: null });
  });

  it('remembers volume, mute and speed', () => {
    saveMediaPreferences({ volume: 0.4 });
    saveMediaPreferences({ muted: true, rate: 1.5 });
    expect(getMediaPreferences(RATES)).toEqual({ muted: true, rate: 1.5, volume: 0.4 });
  });

  it('ignores values the player does not support', () => {
    saveMediaPreferences({ rate: 3, volume: 4 });
    expect(getMediaPreferences(RATES)).toEqual({ muted: false, rate: null, volume: null });
  });

  it('survives corrupted storage', () => {
    localStorage.setItem('bbb-playback-preferences', '{nope');
    expect(getMediaPreferences(RATES).rate).toBe(null);
  });
});

describe('caption preference', () => {
  beforeEach(() => localStorage.clear());

  it('remembers the caption language or off', () => {
    expect(getCaptionPreference()).toBe(null);
    saveCaptionPreference('es');
    expect(getCaptionPreference()).toBe('es');
    saveCaptionPreference('off');
    expect(getCaptionPreference()).toBe('off');
  });

  it('keeps the media preferences alongside', () => {
    saveMediaPreferences({ volume: 0.4 });
    saveCaptionPreference('ar');
    expect(getMediaPreferences(RATES).volume).toBe(0.4);
  });

  it('ignores values that are not a language', () => {
    saveCaptionPreference('<script>');
    expect(getCaptionPreference()).toBe(null);
    localStorage.setItem('bbb-playback-preferences', JSON.stringify({ captions: 42 }));
    expect(getCaptionPreference()).toBe(null);
  });
});
