import {
  buildTimeURL,
  formatTime,
  formatTimeParam,
} from './format';
import { parseTimeToSeconds } from './params';

describe('formatTime', () => {
  it('formats minutes and seconds', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65.9)).toBe('1:05');
  });

  it('adds hours when needed', () => {
    expect(formatTime(3725)).toBe('1:02:05');
  });

  it('handles invalid values', () => {
    expect(formatTime(undefined)).toBe('0:00');
    expect(formatTime(-4)).toBe('0:00');
  });
});

describe('formatTimeParam', () => {
  it('round-trips through the time parser', () => {
    [0, 45, 60, 125, 3599, 3600, 3725, 7384].forEach(seconds => {
      expect(parseTimeToSeconds(formatTimeParam(seconds))).toBe(seconds);
    });
  });
});

describe('buildTimeURL', () => {
  it('sets or replaces the time parameter', () => {
    expect(buildTimeURL('https://host/playback/presentation/2.3/id', 125))
      .toBe('https://host/playback/presentation/2.3/id?t=2m5s');
    expect(buildTimeURL('https://host/p/id?locale=ar&t=1s', 3725))
      .toBe('https://host/p/id?locale=ar&t=1h2m5s');
  });
});
