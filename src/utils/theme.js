import { controls } from 'config';
import {
  EVENTS,
  LAYOUT,
  THEME,
} from 'utils/constants';
import logger from 'utils/logger';
import { getLayout } from 'utils/params';

const STORAGE_KEY = 'bbb-playback-theme';
const QUERY = '(prefers-color-scheme: dark)';

const isTheme = (value) => value === THEME.DARK || value === THEME.LIGHT;

const isEnabled = () => controls.theme && getLayout() !== LAYOUT.DISABLED;

const getStoredTheme = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    return isTheme(value) ? value : null;
  } catch (error) {
    return null;
  }
};

const getSystemTheme = () => {
  if (typeof window.matchMedia !== 'function') return THEME.LIGHT;

  return window.matchMedia(QUERY).matches ? THEME.DARK : THEME.LIGHT;
};

// An explicit choice wins, otherwise the operating system preference is used
const getInitialTheme = () => {
  if (!isEnabled()) return THEME.LIGHT;

  return getStoredTheme() || getSystemTheme();
};

const getTheme = () => {
  const { theme } = document.documentElement.dataset;

  return isTheme(theme) ? theme : THEME.LIGHT;
};

// Everything showing the theme (e.g. the toggle) hears about changes,
// including the ones that follow the operating system
const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.dispatchEvent(new CustomEvent(EVENTS.THEME, { detail: { theme } }));
};

const saveTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    logger.warn('theme', 'failed to save', error);
  }
};

// Follow operating system changes until the viewer picks a theme
const watchSystemTheme = () => {
  if (!isEnabled() || typeof window.matchMedia !== 'function') return;

  const query = window.matchMedia(QUERY);
  const handleChange = () => {
    if (!getStoredTheme()) applyTheme(getSystemTheme());
  };

  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', handleChange);
  }
};

const initTheme = () => {
  applyTheme(getInitialTheme());
  watchSystemTheme();
};

export {
  applyTheme,
  getInitialTheme,
  getTheme,
  initTheme,
  saveTheme,
};
