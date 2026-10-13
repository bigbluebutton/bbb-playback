// Minimal WebVTT/SRT cue reader: timings and text only
const TIMING = /^\s*(\S+)\s+-->\s+(\S+)/;

const toSeconds = (value) => {
  const parts = value.replace(',', '.').split(':').map(parseFloat);
  if (parts.some(part => Number.isNaN(part))) return NaN;

  return parts.reduce((total, part) => total * 60 + part, 0);
};

// Characters that show nothing: spaces of every kind, control characters
// and format marks such as the direction marks in Arabic and Hebrew text
// (U+200E/F, U+202A-E, U+2066-9, U+061C), plus blank-looking fillers
const INVISIBLE = /[\s\p{Z}\p{Cc}\p{Cf}\u115f\u1160\u2800\u3164\uffa0]/gu;

// Lines with nothing to read: spaces, &nbsp;, invisible marks or empty tags
// such as <v Bob></v>. Shown, they would be an empty caption box
const isBlank = (text) => {
  if (typeof text !== 'string') return true;

  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&(nbsp|lrm|rlm|zwj|zwnj|#\d+|#x[\da-f]+);/gi, (entity) => {
      const match = entity.match(/^&#(x?)([\da-f]+);$/i);
      if (!match) return '';

      const char = String.fromCodePoint(parseInt(match[2], match[1] ? 16 : 10));
      return char.replace(INVISIBLE, '');
    })
    .replace(INVISIBLE, '') === '';
};

// Drops the empty lines inside a caption (spaces, &nbsp;, invisible marks),
// which would show as a sliver of caption box above or below the text.
// Lines with tags stay, so formatting that spans lines is not broken
const tidyText = (text) => {
  if (typeof text !== 'string') return '';

  return text
    .split('\n')
    .filter(line => line.includes('<') || !isBlank(line))
    .map(line => line.trim())
    .join('\n');
};

const parseVTT = (text = '') => {
  const cues = [];
  const blocks = text.replace(/\r\n?/g, '\n').split(/\n{2,}/);

  blocks.forEach(block => {
    const lines = block.split('\n');
    const index = lines.findIndex(line => line.includes('-->'));
    if (index === -1) return;

    const match = lines[index].match(TIMING);
    if (!match) return;

    const start = toSeconds(match[1]);
    const end = toSeconds(match[2]);
    const content = tidyText(lines.slice(index + 1).join('\n'));
    if (isBlank(content) || !Number.isFinite(start) || !Number.isFinite(end)) return;

    cues.push({ end, start, text: content });
  });

  return cues;
};

// Cues still ahead of the viewer come first so captions show up right away
const orderFrom = (cues, time = 0) => [
  ...cues.filter(cue => cue.end >= time),
  ...cues.filter(cue => cue.end < time),
];

// Next lines to translate: the ones on screen or coming up first, so a seek
// moves the translation to wherever the viewer is
const pickNext = (pending, time = 0, size = 1) => {
  const ahead = pending.filter(item => item.cue.end >= time);
  const source = ahead.length > 0 ? ahead : pending;

  return [...source].sort((a, b) => a.cue.start - b.cue.start).slice(0, size);
};

export {
  isBlank,
  orderFrom,
  pickNext,
  parseVTT,
  tidyText,
  toSeconds,
};
