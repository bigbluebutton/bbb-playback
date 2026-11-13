const CONTEXT = 48;
const ELLIPSIS = '…';

// Short piece of the slide text around the first match, split so the match
// can be highlighted: { before, match, after }
const getExcerpt = (text = '', query = '') => {
  const clean = text.replace(/\s+/g, ' ').trim();
  const index = query ? clean.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (index === -1) return null;

  let start = Math.max(0, index - CONTEXT);
  let end = Math.min(clean.length, index + query.length + CONTEXT);

  // Cut at word boundaries instead of in the middle of a word
  if (start > 0) {
    const space = clean.indexOf(' ', start);
    if (space !== -1 && space < index) start = space + 1;
  }
  if (end < clean.length) {
    const space = clean.lastIndexOf(' ', end);
    if (space > index + query.length) end = space;
  }

  return {
    before: `${start > 0 ? ELLIPSIS : ''}${clean.slice(start, index)}`,
    match: clean.slice(index, index + query.length),
    after: `${clean.slice(index + query.length, end)}${end < clean.length ? ELLIPSIS : ''}`,
  };
};

export default getExcerpt;
