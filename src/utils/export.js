import { buildTimeURL, formatTime } from './format';

// Saves text as a file through a temporary link
const downloadFile = (name, text, type = 'text/plain') => {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const toFileName = (name, extension) => {
  const base = (name || 'recording')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'recording';

  return `${base}.${extension}`;
};

// Bookmarks as Markdown, each one linking back to its moment
const buildBookmarksMarkdown = ({ heading, items, href, title, date }) => {
  const lines = [`# ${title}`];
  if (date) lines.push('', date);
  lines.push('', `## ${heading}`, '');

  items.forEach(({ note, time }) => {
    const link = `[${formatTime(time)}](${buildTimeURL(href, time)})`;
    lines.push(`- ${link}${note ? ` ${note}` : ''}`);
  });

  return `${lines.join('\n')}\n`;
};

const buildTranscriptText = ({ title, cues }) => {
  const lines = [title, ''];
  cues.forEach(({ start, text }) => {
    lines.push(`[${formatTime(start)}] ${text.replace(/\s*\n\s*/g, ' ')}`);
  });

  return `${lines.join('\n')}\n`;
};

export {
  buildBookmarksMarkdown,
  buildTranscriptText,
  downloadFile,
  toFileName,
};
