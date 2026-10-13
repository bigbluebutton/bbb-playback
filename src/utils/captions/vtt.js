// Minimal WebVTT/SRT cue reader: timings and text only
const TIMING = /^\s*(\S+)\s+-->\s+(\S+)/;

const toSeconds = (value) => {
  const parts = value.replace(',', '.').split(':').map(parseFloat);
  if (parts.some(part => Number.isNaN(part))) return NaN;

  return parts.reduce((total, part) => total * 60 + part, 0);
};

// Lines with nothing to read: spaces, &nbsp;, invisible marks or empty tags
// such as <v Bob></v>. Shown, they would be an empty caption box
const isBlank = (text) => {
  if (typeof text !== 'string') return true;

  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&(nbsp|#160|#xa0|lrm|rlm|zwj|zwnj|#8203|#x200b);/gi, '')
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, '')
    .trim() === '';
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
    const content = lines.slice(index + 1).join('\n').trim();
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
  toSeconds,
};
