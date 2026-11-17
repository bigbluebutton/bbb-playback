import Shortcuts from './shortcuts';

const APPLE_LOGO = '';

const press = (key, code, target = document.body) => target.dispatchEvent(new KeyboardEvent('keydown', {
  altKey: true,
  bubbles: true,
  code,
  key,
  shiftKey: true,
}));

describe('Shortcuts', () => {
  let shortcuts;
  const actions = {
    fullscreen: jest.fn(),
    section: jest.fn(),
    seek: { backward: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    shortcuts = new Shortcuts(actions);
  });

  afterEach(() => {
    shortcuts.destroy();
    document.body.innerHTML = '';
  });

  it('matches letters by the character typed', () => {
    press('K', 'KeyK');
    press('k', 'KeyK');

    expect(actions.fullscreen).toHaveBeenCalledTimes(2);
  });

  it('matches letters by position when Alt types another character (macOS)', () => {
    press(APPLE_LOGO, 'KeyK');
    press('Ò', 'KeyL');

    expect(actions.fullscreen).toHaveBeenCalledTimes(1);
    expect(actions.section).toHaveBeenCalledTimes(1);
  });

  it('matches letters by position on non-Latin layouts', () => {
    press('Л', 'KeyK');
    press('Д', 'KeyL');

    expect(actions.fullscreen).toHaveBeenCalledTimes(1);
    expect(actions.section).toHaveBeenCalledTimes(1);
  });

  it('keeps the character on other Latin layouts', () => {
    // Dvorak: the key in the K position types T, the key typing K is elsewhere
    press('T', 'KeyK');

    expect(actions.fullscreen).not.toHaveBeenCalled();

    press('K', 'KeyV');

    expect(actions.fullscreen).toHaveBeenCalledTimes(1);
  });

  it('matches named keys by name', () => {
    press('ArrowRight', 'ArrowRight');

    expect(actions.seek.backward).not.toHaveBeenCalled();

    press('ArrowLeft', 'ArrowLeft');

    expect(actions.seek.backward).toHaveBeenCalledTimes(1);
  });

  it('leaves the keys of text fields alone', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    press('ArrowLeft', 'ArrowLeft', input);

    expect(actions.seek.backward).not.toHaveBeenCalled();
  });
});
