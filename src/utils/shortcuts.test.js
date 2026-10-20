import Shortcuts, {
  addPlainShortcuts,
  getPlainAction,
  matches,
} from './shortcuts';

const press = (init, target = document.body) => {
  const event = new KeyboardEvent('keydown', {
    altKey: true,
    bubbles: true,
    cancelable: true,
    shiftKey: true,
    ...init,
  });
  target.dispatchEvent(event);

  return event;
};

describe('matches', () => {
  it('matches the reported key', () => {
    expect(matches({ key: 'K', code: 'KeyK' }, 'K')).toBe(true);
    expect(matches({ key: 'ArrowLeft', code: 'ArrowLeft' }, 'ArrowLeft')).toBe(true);
  });

  it('ignores the letter case', () => {
    expect(matches({ key: 'k', code: 'KeyK' }, 'K')).toBe(true);
  });

  it('falls back to the physical key', () => {
    // macOS: Alt+Shift+K reports the Apple logo character
    expect(matches({ key: '', code: 'KeyK' }, 'K')).toBe(true);
    expect(matches({ key: 'Unidentified', code: 'Enter' }, 'Enter')).toBe(true);
  });

  it('rejects other keys', () => {
    expect(matches({ key: 'L', code: 'KeyL' }, 'K')).toBe(false);
    expect(matches({ key: 'ArrowRight', code: 'ArrowRight' }, 'ArrowLeft')).toBe(false);
  });
});

describe('Shortcuts', () => {
  let shortcuts;
  const fullscreen = jest.fn();
  const backward = jest.fn();

  beforeEach(() => {
    fullscreen.mockClear();
    backward.mockClear();
    shortcuts = new Shortcuts({
      fullscreen,
      seek: { backward },
    });
  });

  afterEach(() => shortcuts.destroy());

  it('runs the action for Alt+Shift+key', () => {
    const event = press({ key: 'K', code: 'KeyK' });
    expect(fullscreen).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);

    press({ key: 'ArrowLeft', code: 'ArrowLeft' });
    expect(backward).toHaveBeenCalledTimes(1);
  });

  it('requires both Alt and Shift', () => {
    press({ key: 'K', code: 'KeyK', altKey: false });
    press({ key: 'K', code: 'KeyK', shiftKey: false });
    expect(fullscreen).not.toHaveBeenCalled();
  });

  it('ignores key presses while typing', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    press({ key: 'K', code: 'KeyK' }, input);
    expect(fullscreen).not.toHaveBeenCalled();
    input.remove();
  });

  it('removes its listeners when destroyed', () => {
    shortcuts.destroy();
    press({ key: 'K', code: 'KeyK' });
    expect(fullscreen).not.toHaveBeenCalled();
  });
});

describe('plain shortcuts', () => {
  const event = (key, target = document.body, init = {}) => ({ key, target, ...init });

  it('maps single keys to actions', () => {
    expect(getPlainAction(event(' '))).toBe('play');
    expect(getPlainAction(event('K'))).toBe('play');
    expect(getPlainAction(event('ArrowLeft'))).toBe('backward');
    expect(getPlainAction(event('l'))).toBe('forward');
    expect(getPlainAction(event('f'))).toBe('fullscreen');
    expect(getPlainAction(event('m'))).toBe('mute');
    expect(getPlainAction(event('b'))).toBe('bookmark');
    expect(getPlainAction(event('x'))).toBe(null);
  });

  it('accepts Shift for the keys that need it', () => {
    expect(getPlainAction(event('>', document.body, { shiftKey: true }))).toBe('faster');
    expect(getPlainAction(event('<', document.body, { shiftKey: true }))).toBe('slower');
    expect(getPlainAction(event('?', document.body, { shiftKey: true }))).toBe('help');
    expect(getPlainAction(event('K', document.body, { shiftKey: true }))).toBe(null);
  });

  it('ignores modified keys', () => {
    expect(getPlainAction(event('k', document.body, { altKey: true }))).toBe(null);
    expect(getPlainAction(event('k', document.body, { ctrlKey: true }))).toBe(null);
  });

  it('leaves text fields, buttons and lists alone', () => {
    const input = document.createElement('input');
    const button = document.createElement('button');
    const list = document.createElement('div');
    list.setAttribute('tabindex', '0');

    expect(getPlainAction(event(' ', input))).toBe(null);
    expect(getPlainAction(event(' ', button))).toBe(null);
    expect(getPlainAction(event('ArrowLeft', list))).toBe(null);
  });

  it('lets letters work on buttons and lists, where only Space and arrows are taken', () => {
    const button = document.createElement('button');
    const list = document.createElement('div');
    list.setAttribute('tabindex', '0');
    const slider = document.createElement('div');
    slider.setAttribute('role', 'slider');

    expect(getPlainAction(event('k', button))).toBe('play');
    expect(getPlainAction(event('m', button))).toBe('mute');
    expect(getPlainAction(event('ArrowLeft', button))).toBe('backward');
    expect(getPlainAction(event('j', list))).toBe('backward');
    expect(getPlainAction(event(' ', list))).toBe(null);
    expect(getPlainAction(event('ArrowRight', slider))).toBe(null);
    expect(getPlainAction(event('l', slider))).toBe('forward');
  });

  it('finds the keys on other keyboard layouts by their place', () => {
    // Arabic layout: K, J, L, F, M, B type these letters
    expect(getPlainAction(event('ن', document.body, { code: 'KeyK' }))).toBe('play');
    expect(getPlainAction(event('ت', document.body, { code: 'KeyJ' }))).toBe('backward');
    expect(getPlainAction(event('م', document.body, { code: 'KeyL' }))).toBe('forward');
    expect(getPlainAction(event('ب', document.body, { code: 'KeyF' }))).toBe('fullscreen');
    expect(getPlainAction(event('ة', document.body, { code: 'KeyM' }))).toBe('mute');
    expect(getPlainAction(event('لا', document.body, { code: 'KeyB' }))).toBe('bookmark');
    expect(getPlainAction(event('؟', document.body, { code: 'Slash', shiftKey: true }))).toBe('help');
    expect(getPlainAction(event(',', document.body, { code: 'Comma', shiftKey: true }))).toBe('slower');
    expect(getPlainAction(event('.', document.body, { code: 'Period', shiftKey: true }))).toBe('faster');
    // Shift with a letter stays free
    expect(getPlainAction(event('ن', document.body, { code: 'KeyK', shiftKey: true }))).toBe(null);
  });

  it('ignores keys while an input method composes text', () => {
    expect(getPlainAction(event('k', document.body, { isComposing: true }))).toBe(null);
  });

  it('works on the video element', () => {
    const player = document.createElement('div');
    player.className = 'video-js';
    player.setAttribute('tabindex', '-1');

    expect(getPlainAction(event('k', player))).toBe('play');
  });

  it('dispatches and cleans up', () => {
    const play = jest.fn();
    const remove = addPlainShortcuts({ play });

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', bubbles: true }));
    expect(play).toHaveBeenCalledTimes(1);

    remove();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', bubbles: true }));
    expect(play).toHaveBeenCalledTimes(1);
  });
});
