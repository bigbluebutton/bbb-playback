const params = new URLSearchParams(window.location.search);
const debug = params ? params.has('debug') : false;

const logger = {
  info: (...msg) => console.info(...msg),
  debug: (...msg) => debug ? console.debug(...msg) : null,
  warn: (...msg) => debug ? console.warn(...msg) : null,
  error: (...msg) => console.error(...msg),
};

export default logger;
