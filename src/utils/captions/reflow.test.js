import {
  countWords,
  formatTimestamp,
  mergeCues,
  needsReflow,
  reflowCues,
  serializeVTT,
  textWidth,
} from './reflow';
import { parseVTT } from './vtt';

const options = {
  enabled: true,
  threshold: 4,
  characters: 84,
  duration: 7,
  gap: 1.5,
};

// Live transcription is recorded a word at a time and the recording scripts
// wrap each pair of words into a two-line cue
const wordLevel = [
  'WEBVTT',
  '',
  '00:00:01.000 --> 00:00:01.600',
  'Hello',
  'everyone',
  '',
  '00:00:01.600 --> 00:00:02.300',
  'welcome',
  'to',
  '',
  '00:00:02.300 --> 00:00:03.300',
  'the',
  'class.',
  '',
  '00:00:06.000 --> 00:00:07.000',
  'Today',
  '',
].join('\n');

const sentenceLevel = [
  'WEBVTT',
  '',
  '00:00:01.000 --> 00:00:03.000',
  'Hello everyone, welcome to the class.',
  '',
  '00:00:06.000 --> 00:00:09.000',
  'Today we are going to talk about captions.',
  '',
].join('\n');

const texts = cues => cues.map(cue => cue.text);

it('formats timestamps', () => {
  expect(formatTimestamp(1)).toEqual('00:00:01.000');
  expect(formatTimestamp(3723.004)).toEqual('01:02:03.004');
  expect(formatTimestamp(123.5)).toEqual('00:02:03.500');
  expect(formatTimestamp(-1)).toEqual('00:00:00.000');
});

it('counts words, also in scripts written without spaces', () => {
  expect(countWords('Hello\neveryone')).toEqual(2);
  expect(countWords('Hello everyone, welcome to the class.')).toEqual(6);
  // Markup is not spoken
  expect(countWords('<v Bob>Hello</v>')).toEqual(1);
  expect(countWords('  ')).toEqual(0);
  // 今日は / 皆さん / こんにちは
  expect(countWords('今日は皆さんこんにちは')).toBeGreaterThanOrEqual(3);
  // 我们 / 今天 / 讨论 / 字幕
  expect(countWords('我们今天讨论字幕')).toBeGreaterThanOrEqual(3);
});

it('measures text width with wide characters counting twice', () => {
  expect(textWidth('Hello')).toEqual(5);
  expect(textWidth('字幕')).toEqual(4);
  expect(textWidth('a 字幕 b')).toEqual(8);
  expect(textWidth('𠀋')).toEqual(2);
});

it('tells word-level cues from sentence-level cues', () => {
  expect(needsReflow(parseVTT(wordLevel), options)).toEqual(true);
  expect(needsReflow(parseVTT(sentenceLevel), options)).toEqual(false);
  expect(needsReflow([], options)).toEqual(false);
  expect(needsReflow(parseVTT(wordLevel), { ...options, enabled: false })).toEqual(false);

  const japanese = [
    { start: 0, end: 3, text: '今日は皆さんこんにちは、今日は字幕について話します。' },
    { start: 3, end: 6, text: '最初に録画の設定を確認しましょう。' },
  ];

  expect(needsReflow(japanese, options)).toEqual(false);
});

it('merges word-level cues into sentences', () => {
  const merged = mergeCues(parseVTT(wordLevel), options);

  expect(merged.map(({ start, end, text }) => ({ start, end, text }))).toEqual([
    { start: 1, end: 3.3, text: 'Hello everyone welcome to the class.' },
    { start: 6, end: 7, text: 'Today' },
  ]);

  // The cues each one was made from
  expect(merged.map(cue => cue.cues.length)).toEqual([3, 1]);
});

it('starts a new cue after a pause', () => {
  const cues = [
    { start: 0, end: 1, text: 'one' },
    { start: 1, end: 2, text: 'two' },
    { start: 3.5, end: 4.5, text: 'three' },
    { start: 5, end: 6, text: 'four' },
  ];

  expect(mergeCues(cues, options).map(({ start, end, text }) => ({ start, end, text }))).toEqual([
    { start: 0, end: 2, text: 'one two' },
    { start: 3.5, end: 6, text: 'three four' },
  ]);
});

it('limits the characters in a cue', () => {
  const cues = [];
  for (let i = 0; i < 12; i++) {
    cues.push({ start: i, end: i + 1, text: 'abcdefghi' });
  }

  const merged = mergeCues(cues, { ...options, duration: 100 });

  // 8 * 9 characters + 7 spaces = 79 fits, 9 words do not
  expect(merged.map(cue => cue.text.split(' ').length)).toEqual([8, 4]);
  expect(merged[0].text).toEqual(Array(8).fill('abcdefghi').join(' '));
  expect([merged[0].start, merged[0].end]).toEqual([0, 8]);
  expect([merged[1].start, merged[1].end]).toEqual([8, 12]);
});

it('limits the duration of a cue', () => {
  const cues = [];
  for (let i = 0; i < 10; i++) {
    cues.push({ start: i * 2, end: i * 2 + 2, text: 'a' });
  }

  const merged = mergeCues(cues, { ...options, gap: 10 });

  expect(merged.map(cue => cue.end - cue.start)).toEqual([6, 6, 6, 2]);
});

it('breaks at the end of a sentence once a cue holds enough text', () => {
  const cues = [
    { start: 0, end: 1, text: 'Yes.' },
    { start: 1, end: 2, text: 'This sentence is long enough to fill half a cue.' },
    { start: 2, end: 3, text: 'Next one.' },
    { start: 3, end: 4, text: 'Again?' },
    { start: 4, end: 5, text: 'Sure!' },
    { start: 5, end: 6, text: 'And this is where it should end."' },
    { start: 6, end: 7, text: 'Last' },
  ];

  expect(texts(mergeCues(cues, options))).toEqual([
    'Yes. This sentence is long enough to fill half a cue.',
    'Next one. Again? Sure! And this is where it should end."',
    'Last',
  ]);
});

it('breaks at the end of an Arabic sentence', () => {
  const cues = [
    { start: 0, end: 1, text: 'هل الجميع يسمعني بشكل واضح الآن' },
    { start: 1, end: 2, text: 'في هذه الجلسة؟' },
    { start: 2, end: 3, text: 'نبدأ' },
  ];

  expect(texts(mergeCues(cues, options))).toEqual([
    'هل الجميع يسمعني بشكل واضح الآن في هذه الجلسة؟',
    'نبدأ',
  ]);
});

it('sorts cues and skips empty ones', () => {
  const cues = [
    { start: 1, end: 2, text: 'two' },
    { start: 0, end: 1, text: 'one' },
    { start: 2, end: 3, text: '  \n ' },
    { start: 3, end: 4, text: 'three' },
  ];

  expect(mergeCues(cues, options).map(({ start, end, text }) => ({ start, end, text }))).toEqual([
    { start: 0, end: 4, text: 'one two three' },
  ]);

  expect(mergeCues([], options)).toEqual([]);
  expect(mergeCues(null, options)).toEqual([]);
});

it('joins wide characters without spaces and limits their width', () => {
  const cues = [
    { start: 0, end: 1, text: '今日は\n皆さん' },
    { start: 1, end: 2, text: 'こんにちは' },
    { start: 2, end: 3, text: '字幕 test' },
  ];

  expect(texts(mergeCues(cues, options))).toEqual(['今日は皆さんこんにちは字幕 test']);

  // 10 wide characters per cue take 20 columns: 4 cues fit in 84
  const wide = [];
  for (let i = 0; i < 6; i++) {
    wide.push({ start: i, end: i + 1, text: '一二三四五六七八九十' });
  }

  expect(mergeCues(wide, options).map(cue => textWidth(cue.text))).toEqual([80, 40]);
});

it('reflows word-level cues and leaves the others alone', () => {
  const words = parseVTT(wordLevel);
  expect(texts(reflowCues(words, options))).toEqual([
    'Hello everyone welcome to the class.',
    'Today',
  ]);

  const sentences = parseVTT(sentenceLevel);
  expect(reflowCues(sentences, options)).toBe(sentences);
  expect(reflowCues(words, { ...options, enabled: false })).toBe(words);
  expect(reflowCues([], options)).toEqual([]);
});

it('serializes cues', () => {
  const cues = [
    { start: 1, end: 3.3, text: 'Hello everyone welcome to the class.' },
    { start: 6, end: 6, text: 'Today &amp; tomorrow' },
  ];

  expect(serializeVTT(cues)).toEqual([
    'WEBVTT',
    '',
    '00:00:01.000 --> 00:00:03.300',
    'Hello everyone welcome to the class.',
    '',
    '00:00:06.000 --> 00:00:06.001',
    'Today &amp; tomorrow',
    '',
  ].join('\n'));
});
