// The whiteboard package ships an ESM bundle that jsdom cannot load, so the whole
// module is stubbed. Stubs below hold the exports the tests actually rely on; any
// other export throws on access, so a test that starts using a new symbol fails
// with its name instead of silently receiving undefined.
jest.mock('@bigbluebutton/tldraw', () => {
  const stubs = {
    // Flags the stub as an ES module so the interop layer hands it over as is:
    // without it a namespace import copies the known keys into a plain object
    // and the guard below never runs.
    __esModule: true,
    DefaultColorThemePalette: {
      lightMode: { black: {}, yellow: {} },
      darkMode: { black: {}, yellow: {} },
    },
  };

  // Properties the module interop layer probes before any export is read.
  const interop = ['__esModule', 'default', 'then'];

  return new Proxy(stubs, {
    get: (target, property) => {
      if (property in target) return target[property];
      if (typeof property === 'symbol' || interop.includes(property)) return undefined;

      throw new Error(
        `@bigbluebutton/tldraw is mocked and has no "${property}" export. Add it to src/setupTests.js.`
      );
    },
  });
});
