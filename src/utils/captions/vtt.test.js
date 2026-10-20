import {
  isBlank,
  orderFrom,
  parseVTT,
  pickNext,
  tidyText,
  toPlainText,
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

  it('drops empty lines inside a caption', () => {
    expect(tidyText(' \nجلسة إرشادية')).toBe('جلسة إرشادية');
    expect(tidyText('&nbsp;\nHi\n\u200f')).toBe('Hi');
    expect(tidyText('One\n \nTwo ')).toBe('One\nTwo');
    expect(tidyText('<i>\nHi</i>')).toBe('<i>\nHi</i>');
    expect(tidyText('\u202b\nحتى دراسياً\n\u202c')).toBe('حتى دراسياً');
    expect(tidyText('\u2067\u2069\nحتى')).toBe('حتى');
    expect(parseVTT('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n \nHi\n')).toEqual([
      { start: 1, end: 2, text: 'Hi' },
    ]);
  });

  it('keeps the words of a caption without its markup', () => {
    // Word timings, as live captions write them
    expect(toPlainText('<00:00:14.080><c>السلام</c><00:00:15.480><c> عليكم</c>')).toBe('السلام عليكم');
    expect(toPlainText('<i>Hello</i> <b>there</b>')).toBe('Hello there');
    expect(toPlainText('<v Bob>Hi</v>')).toBe('Bob: Hi');
    expect(toPlainText('<v.loud Alice Smith>Hey')).toBe('Alice Smith: Hey');
    expect(toPlainText('Q&amp;A &lt;3 &#1605;')).toBe('Q&A <3 م');
    expect(toPlainText('<00:00:01.000>\n<c>Two</c>  lines')).toBe('Two lines');
    expect(toPlainText(undefined)).toBe('');
  });

  it('tells blank lines from lines with text', () => {
    expect(isBlank(' \u00a0 ')).toBe(true);
    expect(isBlank('<i> </i>')).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    // Direction marks and isolates around Arabic and Hebrew text
    ['\u202b', '\u202c', '\u061c', '\u2067\u2069', '\u200f\u200e', '\u3000', '&#x202b;', '&#8207;']
      .forEach(text => expect(isBlank(text)).toBe(true));
    expect(isBlank('&#1605;')).toBe(false);
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
