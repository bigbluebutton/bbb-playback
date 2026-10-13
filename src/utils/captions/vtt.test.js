import {
  isBlank,
  orderFrom,
  parseVTT,
  pickNext,
  toSeconds,
} from './vtt';

const VTT = `WEBVTT

NOTE produced by the recording

1
00:00:00.500 --> 00:00:05.000 align:center
Welcome everyone,
today we review Q3.

00:01:02.250 --> 00:01:04.000
Questions?

00:01:05.000 --> 00:01:06.000
`;

describe('vtt', () => {
  it('converts timestamps', () => {
    expect(toSeconds('00:01:02.250')).toBe(62.25);
    expect(toSeconds('01:02.5')).toBe(62.5);
    expect(toSeconds('00:00:01,200')).toBe(1.2);
  });

  it('reads cues and skips notes and empty cues', () => {
    expect(parseVTT(VTT)).toEqual([
      { start: 0.5, end: 5, text: 'Welcome everyone,\ntoday we review Q3.' },
      { start: 62.25, end: 64, text: 'Questions?' },
    ]);
  });

  it('skips lines with nothing to read', () => {
    const blank = 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n&nbsp;\n\n'
      + '00:00:02.000 --> 00:00:03.000\n<v Bob></v>\n\n'
      + '00:00:03.000 --> 00:00:04.000\n\u200b\n\n'
      + '00:00:04.000 --> 00:00:05.000\n<v Bob>Hi</v>\n';
    expect(parseVTT(blank)).toEqual([{ start: 4, end: 5, text: '<v Bob>Hi</v>' }]);
  });

  it('tells blank lines from lines with text', () => {
    expect(isBlank(' \u00a0 ')).toBe(true);
    expect(isBlank('<i> </i>')).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank('مرحبا')).toBe(false);
    expect(isBlank('<b>Q3</b>')).toBe(false);
  });

  it('handles windows line endings', () => {
    expect(parseVTT('WEBVTT\r\n\r\n00:00:01.000 --> 00:00:02.000\r\nHi\r\n')).toEqual([
      { start: 1, end: 2, text: 'Hi' },
    ]);
  });

  it('starts with the cues ahead of the current time', () => {
    const cues = [{ end: 5 }, { end: 10 }, { end: 15 }];
    expect(orderFrom(cues, 8)).toEqual([{ end: 10 }, { end: 15 }, { end: 5 }]);
  });

  it('picks the lines at or after the current time first', () => {
    const item = (start, end) => ({ cue: { start, end } });
    const pending = [item(0, 2), item(10, 12), item(4, 6), item(20, 22)];

    expect(pickNext(pending, 5, 2)).toEqual([item(4, 6), item(10, 12)]);
    expect(pickNext(pending, 0, 1)).toEqual([item(0, 2)]);
    // Past the last line, whatever is left
    expect(pickNext([item(0, 2), item(4, 6)], 30, 5)).toEqual([item(0, 2), item(4, 6)]);
    expect(pickNext([], 3, 1)).toEqual([]);
  });
});
