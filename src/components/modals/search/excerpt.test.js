import getExcerpt from './excerpt';

describe('getExcerpt', () => {
  it('splits the text around the match, ignoring case', () => {
    expect(getExcerpt('Quarterly Product Review', 'product')).toEqual({
      before: 'Quarterly ',
      match: 'Product',
      after: ' Review',
    });
  });

  it('trims long text around the match', () => {
    const text = `${'a'.repeat(100)} target ${'b'.repeat(100)}`;
    const { before, match, after } = getExcerpt(text, 'target');

    expect(match).toBe('target');
    expect(before.startsWith('…')).toBe(true);
    expect(after.endsWith('…')).toBe(true);
    expect(before.length).toBeLessThan(60);
  });

  it('collapses whitespace and handles misses', () => {
    expect(getExcerpt('one\n\n  two', 'two')).toEqual({ before: 'one ', match: 'two', after: '' });
    expect(getExcerpt('nothing here', 'missing')).toBe(null);
    expect(getExcerpt('', '')).toBe(null);
  });

  it('works with Arabic text', () => {
    expect(getExcerpt('مراجعة الربع الثالث', 'الربع')).toEqual({ before: 'مراجعة ', match: 'الربع', after: ' الثالث' });
  });

  it('cuts at word boundaries', () => {
    const text = 'Roadmap: mobile app, live translation of captions and a refreshed product dashboard for every team in the company this year.';
    const { before, after } = getExcerpt(text, 'product');

    // Starts and ends on whole words
    expect(before).toBe('…live translation of captions and a refreshed ');
    expect(after).toBe(' dashboard for every team in the company this…');
  });
});
