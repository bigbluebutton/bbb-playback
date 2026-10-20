import bookmarks from './bookmarks';
import { EVENTS } from './constants';

const ID = 'recording';

describe('bookmarks', () => {
  beforeEach(() => localStorage.clear());

  it('adds bookmarks sorted by time and announces changes', () => {
    const listener = jest.fn();
    document.addEventListener(EVENTS.BOOKMARKS, listener);

    bookmarks.add(ID, 90, 'Roadmap');
    bookmarks.add(ID, 12.5);

    expect(bookmarks.list(ID).map(b => [b.time, b.note])).toEqual([[12.5, ''], [90, 'Roadmap']]);
    expect(listener).toHaveBeenCalledTimes(2);
    document.removeEventListener(EVENTS.BOOKMARKS, listener);
  });

  it('does not duplicate the same moment', () => {
    const first = bookmarks.add(ID, 30);
    const second = bookmarks.add(ID, 30.6);

    expect(second.id).toBe(first.id);
    expect(bookmarks.list(ID)).toHaveLength(1);
  });

  it('updates notes and removes bookmarks', () => {
    const { id } = bookmarks.add(ID, 5);
    bookmarks.update(ID, id, 'Important');
    expect(bookmarks.list(ID)[0].note).toBe('Important');

    bookmarks.remove(ID, id);
    expect(bookmarks.list(ID)).toEqual([]);
    expect(localStorage.getItem('bbb-playback-bookmarks')).toBe('{}');
  });

  it('keeps recordings apart and survives bad storage', () => {
    bookmarks.add('a', 1);
    expect(bookmarks.list('b')).toEqual([]);

    localStorage.setItem('bbb-playback-bookmarks', 'nope');
    expect(bookmarks.list('a')).toEqual([]);
  });
});
