import { captions as config } from 'config';

// Captions typed or transcribed live are recorded as they are produced, so
// the recording scripts write them a word or two per cue and the player
// shows them word by word. This regroups such cues into sentence-sized
// ones. Cues that already hold sentences are left as they are.

// Sentence-ending punctuation, optionally followed by closing quotes/brackets
const SENTENCE_END = /[.!?…。！？؟۔]["'”’»)\]]*$/;
// East Asian wide characters: twice as wide as Latin ones and written
// without spaces in between
const WIDE = '[\\u1100-\\u115F\\u2E80-\\u303E\\u3041-\\u33FF\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uA960-\\uA97F\\uAC00-\\uD7A3\\uF900-\\uFAFF\\uFE30-\\uFE4F\\uFF00-\\uFF60\\uFFE0-\\uFFE6\\u{20000}-\\u{3FFFD}]';
const WIDE_CHAR = new RegExp(WIDE, 'gu');
const WIDE_GAP = new RegExp(`(${WIDE})\\s+(?=${WIDE})`, 'gu');

const segmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'word' })
  : null;

const getOptions = (options) => options || (config.reflow || {});

const pad = (value, length) => String(value).padStart(length, '0');

const formatTimestamp = (seconds) => {
  const total = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor(total / 60000) % 60;
  const secs = Math.floor(total / 1000) % 60;
  const millis = total % 1000;

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(millis, 3)}`;
};

// Collapses whitespace, including the line breaks the recording scripts add,
// into single spaces, or into nothing between wide characters
const normalizeText = (text) => text.replace(/\s+/g, ' ').trim().replace(WIDE_GAP, '$1');

// Length of the text as displayed, wide characters count twice
const textWidth = (text) => {
  const wide = text.match(WIDE_CHAR);

  return Array.from(text).length + (wide ? wide.length : 0);
};

// Words in the text, without its markup
const countWords = (text) => {
  const normalized = normalizeText(text.replace(/<[^>]*>/g, ' '));
  if (!normalized) return 0;

  if (segmenter) {
    let words = 0;
    for (const segment of segmenter.segment(normalized)) {
      if (segment.isWordLike) words += 1;
    }

    return words;
  }

  return normalized.split(' ').length;
};

const endsSentence = (text) => SENTENCE_END.test(text.replace(/<[^>]*>/g, '').trim());

// Whether the cues come a word or two at a time
const needsReflow = (cues, options) => {
  const { enabled = true, threshold = 4 } = getOptions(options);
  if (!enabled || !Array.isArray(cues) || cues.length === 0) return false;

  const words = cues.reduce((total, cue) => total + countWords(cue.text || ''), 0);

  return (words / cues.length) < threshold;
};

// Groups consecutive cues ({ start, end, text }) into sentence-sized ones
const mergeCues = (cues, options) => {
  if (!Array.isArray(cues) || cues.length === 0) return [];

  const {
    characters = 84,
    duration = 7,
    gap = 1.5,
  } = getOptions(options);

  const sorted = [...cues].sort((a, b) => a.start - b.start);
  const merged = [];
  let current = null;

  sorted.forEach((cue) => {
    const text = normalizeText(cue.text || '');
    if (!text) return;

    if (current) {
      // Break at the end of a sentence once the cue holds a reasonable
      // amount of text, otherwise keep short sentences together
      const sentence = endsSentence(current.text) && textWidth(current.text) >= characters / 2;
      const joined = normalizeText(`${current.text} ${text}`);

      const fits = !sentence
        && textWidth(joined) <= characters
        && cue.end - current.start <= duration
        && cue.start - current.end < gap;

      if (fits) {
        current.text = joined;
        current.end = Math.max(current.end, cue.end);
        current.cues.push(cue);
        return;
      }

      merged.push(current);
    }

    current = {
      ...cue,
      start: cue.start,
      end: cue.end,
      text,
      // The cues this one was made from
      cues: [cue],
    };
  });

  if (current) merged.push(current);

  return merged;
};

// The cues regrouped into sentences when they come a word or two at a
// time, otherwise the cues as they are
const reflowCues = (cues, options) => {
  if (!needsReflow(cues, options)) return cues;

  return mergeCues(cues, options);
};

const serializeVTT = (cues) => {
  const blocks = cues.map(({ start, end, text }) => {
    // A cue must end after it starts
    const stop = Math.max(end, start + 0.001);

    return `${formatTimestamp(start)} --> ${formatTimestamp(stop)}\n${text}`;
  });

  return `WEBVTT\n\n${blocks.join('\n\n')}\n`;
};

export {
  countWords,
  formatTimestamp,
  mergeCues,
  needsReflow,
  reflowCues,
  serializeVTT,
  textWidth,
};
