import {
  applyTheme,
  getInitialTheme,
  getTheme,
  saveTheme,
} from './theme';

const mockMatchMedia = (dark) => {
  window.matchMedia = jest.fn(() => ({
    matches: dark,
    addEventListener: jest.fn(),
  }));
};

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('follows the system preference by default', () => {
    mockMatchMedia(true);
    expect(getInitialTheme()).toBe('dark');

    mockMatchMedia(false);
    expect(getInitialTheme()).toBe('light');
  });

  it('prefers the saved choice over the system', () => {
    mockMatchMedia(true);
    saveTheme('light');
    expect(getInitialTheme()).toBe('light');
  });

  it('ignores invalid saved values', () => {
    mockMatchMedia(false);
    localStorage.setItem('bbb-playback-theme', 'purple');
    expect(getInitialTheme()).toBe('light');
  });

  it('applies the theme to the document', () => {
    expect(getTheme()).toBe('light');
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(getTheme()).toBe('dark');
  });
});
