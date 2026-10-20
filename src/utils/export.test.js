import {
  buildBookmarksMarkdown,
  buildTranscriptText,
  toFileName,
} from './export';

describe('export', () => {
  it('builds markdown with links to each moment', () => {
    const text = buildBookmarksMarkdown({
      date: 'June 22, 2026',
      heading: 'Bookmarks',
      href: 'https://host/playback/presentation/2.3/id?locale=ar',
      items: [{ note: 'Revenue chart', time: 14 }, { note: '', time: 3725 }],
      title: 'Weekly review',
    });

    expect(text).toBe([
      '# Weekly review',
      '',
      'June 22, 2026',
      '',
      '## Bookmarks',
      '',
      '- [0:14](https://host/playback/presentation/2.3/id?locale=ar&t=14s) Revenue chart',
      '- [1:02:05](https://host/playback/presentation/2.3/id?locale=ar&t=1h2m5s)',
      '',
    ].join('\n'));
  });

  it('builds a plain text transcript', () => {
    expect(buildTranscriptText({
      cues: [{ start: 1, text: 'Hello\nworld' }, { start: 65, text: 'Bye' }],
      title: 'Weekly review',
    })).toBe('Weekly review\n\n[0:01] Hello world\n[1:05] Bye\n');
  });

  it('makes safe file names', () => {
    expect(toFileName('Review: Q3/Q4 *final*', 'md')).toBe('Review Q3 Q4 final.md');
    expect(toFileName('الخبرة الثانية - 22/6/2026', 'txt')).toBe('الخبرة الثانية - 22 6 2026.txt');
    expect(toFileName('', 'txt')).toBe('recording.txt');
  });
});
