import watched, { addRange, coverage } from './watched';
import { EVENTS } from './constants';

describe('watched ranges', () => {
  it('merges overlapping and touching ranges', () => {
    let ranges = [];
    ranges = addRange(ranges, 10, 20);
    ranges = addRange(ranges, 30, 40);
    ranges = addRange(ranges, 0, 5);
    expect(ranges).toEqual([[0, 5], [10, 20], [30, 40]]);

    ranges = addRange(ranges, 18, 31);
    expect(ranges).toEqual([[0, 5], [10, 40]]);

    ranges = addRange(ranges, 5, 10);
    expect(ranges).toEqual([[0, 40]]);
  });

  it('ignores empty ranges', () => {
    expect(addRange([[0, 1]], 5, 5)).toEqual([[0, 1]]);
  });

  it('measures coverage of a section', () => {
    const ranges = [[0, 10], [20, 30]];
    expect(coverage(ranges, 0, 30)).toBe(20);
    expect(coverage(ranges, 5, 25)).toBe(10);
    expect(coverage(ranges, 40, 50)).toBe(0);
  });
});

describe('watched tracking', () => {
  let clock = 0;
  const advance = (seconds) => { clock += seconds * 1000; };

  beforeEach(() => {
    localStorage.clear();
    clock = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => clock);
  });

  afterEach(() => jest.restoreAllMocks());

  it('counts normal playback, not seeks', () => {
    const listener = jest.fn();
    document.addEventListener(EVENTS.WATCHED, listener);

    watched.load('rec');
    [0, 0.1, 0.2, 0.3].forEach(t => { watched.track(t); advance(0.1); });
    watched.track(50); // seek
    advance(0.1);
    watched.track(50.1);
    watched.interrupt();
    watched.track(60); // after a pause
    advance(0.1);
    watched.track(60.1);

    const ranges = watched.getRanges().map(([s, e]) => [s, Math.round(e * 10) / 10]);
    expect(ranges).toEqual([[0, 0.3], [50, 50.1], [60, 60.1]]);
    expect(listener).toHaveBeenCalled();
    document.removeEventListener(EVENTS.WATCHED, listener);
  });

  it('counts slow timers and fast speeds', () => {
    watched.load('rec');
    // Background tab at 2x: one update per second, 2 seconds apart
    [0, 2, 4, 6].forEach(t => { watched.track(t, 2); advance(1); });
    // Throttled even more at 1x
    watched.track(6.5, 1);
    advance(2.5);
    watched.track(9, 1);

    expect(watched.getRanges()).toEqual([[0, 9]]);
  });

  it('announces loaded progress', () => {
    const listener = jest.fn();
    document.addEventListener(EVENTS.WATCHED, listener);
    watched.load('rec');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(watched.isLoaded()).toBe(true);
    document.removeEventListener(EVENTS.WATCHED, listener);
  });

  it('persists per recording', () => {
    watched.load('rec');
    watched.track(1);
    advance(1);
    watched.track(2);
    watched.save();

    expect(watched.load('rec')).toEqual([[1, 2]]);
    expect(watched.load('other')).toEqual([]);
  });
});
