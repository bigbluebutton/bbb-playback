const pad = (value) => String(value).padStart(2, '0');

const split = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));

  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
};

// Clock style label, e.g. 1:02:03 or 2:03
const formatTime = (value) => {
  const {
    hours,
    minutes,
    seconds,
  } = split(value);

  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;

  return `${minutes}:${pad(seconds)}`;
};

// Value for the `t` query string, e.g. 1h2m3s, 2m3s or 3s
const formatTimeParam = (value) => {
  const {
    hours,
    minutes,
    seconds,
  } = split(value);

  if (hours > 0) return `${hours}h${minutes}m${seconds}s`;
  if (minutes > 0) return `${minutes}m${seconds}s`;

  return `${seconds}s`;
};

const buildTimeURL = (href, seconds) => {
  const url = new URL(href);
  url.searchParams.set('t', formatTimeParam(seconds));

  return url.toString();
};

export {
  buildTimeURL,
  formatTime,
  formatTimeParam,
};
