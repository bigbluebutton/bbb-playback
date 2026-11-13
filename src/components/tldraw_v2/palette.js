import { DefaultColorThemePalette } from '@bigbluebutton/tldraw';

const setupColorThemePaletteOverrides = () => {
  // Override the default color theme to use our custom palette with more vibrant yellow highlights
  DefaultColorThemePalette.lightMode.black.highlight = {
    srgb: '#FFFF00',
    p3: 'color(display-p3 1 1 0)',
  };
  DefaultColorThemePalette.darkMode.black.highlight = {
    srgb: '#FFFF00',
    p3: 'color(display-p3 1 1 0)',
  };
  // Override the default yellow color to be a more vibrant yellow
  DefaultColorThemePalette.lightMode.yellow = {
    solid: '#FFFF00',
    highlight: {
      srgb: '#FFFF00',
      p3: 'color(display-p3 1 1 0)',
    },
  };
  DefaultColorThemePalette.darkMode.yellow = {
    solid: '#FFFF00',
    highlight: {
      srgb: '#FFFF00',
      p3: 'color(display-p3 1 1 0)',
    },
  };
};

export default setupColorThemePaletteOverrides;
