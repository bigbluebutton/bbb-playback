jest.mock('@bigbluebutton/tldraw', () => ({
  DefaultColorThemePalette: {
    lightMode: { black: {}, yellow: {} },
    darkMode: { black: {}, yellow: {} },
  },
}));
