import {
  buildChapters,
  getChapterAt,
  getTitle,
} from './chapters';

describe('getTitle', () => {
  it('takes the first sentence of the first line', () => {
    expect(getTitle('Quarterly Review. Agenda: results')).toBe('Quarterly Review.');
    expect(getTitle('\n  Roadmap 2026\nMobile app')).toBe('Roadmap 2026');
    expect(getTitle('ما هي الخطة؟ ثم التفاصيل')).toBe('ما هي الخطة؟');
  });

  it('shortens long titles at a word', () => {
    const title = getTitle('word '.repeat(30));
    expect(title.endsWith('…')).toBe(true);
    expect(title.length).toBeLessThanOrEqual(65);
  });

  it('handles missing text', () => {
    expect(getTitle('')).toBe(null);
    expect(getTitle(undefined)).toBe(null);
    expect(getTitle('   \n ')).toBe(null);
  });
});

describe('buildChapters', () => {
  const thumbnails = [
    { src: 'thumb-2', timestamp: 30, alt: 'Results' },
    { src: 'thumb-1', timestamp: 0, alt: 'Welcome' },
    { src: 'screenshare', timestamp: 50, alt: '' },
  ];

  it('orders chapters and computes their ends', () => {
    const chapters = buildChapters(thumbnails, 90);

    expect(chapters.map(c => [c.number, c.start, c.end, c.title, c.screenshare])).toEqual([
      [1, 0, 30, 'Welcome', false],
      [2, 30, 50, 'Results', false],
      [3, 50, 90, null, true],
    ]);
  });

  it('finds the chapter at a time', () => {
    const chapters = buildChapters(thumbnails, 90);

    expect(getChapterAt(chapters, 35).number).toBe(2);
    expect(getChapterAt(chapters, 0).number).toBe(1);
    expect(getChapterAt([], 5)).toBe(null);
  });
});
