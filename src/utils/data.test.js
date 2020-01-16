import {
  getCurrentDataIndex,
  getFileIndex,
  getFileType,
} from './data';

it('gets current data index', () => {
  const data = [
    { timestamp: 1.0 },
    { timestamp: 2.0 },
  ];

  // Under
  expect(getCurrentDataIndex(data, 0.0)).toEqual(0);

  // Bottom boundary
  expect(getCurrentDataIndex(data, 0.9)).toEqual(0);
  expect(getCurrentDataIndex(data, 1.0)).toEqual(0);

  // Top boundary
  expect(getCurrentDataIndex(data, 2.0)).toEqual(0);
  expect(getCurrentDataIndex(data, 2.1)).toEqual(1);

  // Above
  expect(getCurrentDataIndex(data, 3.0)).toEqual(1);

  const empty = [];
  expect(getCurrentDataIndex(empty, 0.0)).toEqual(null);

  const object = { timestamp: 1.2 };
  expect(getCurrentDataIndex(object, 0.0)).toEqual(null);

  const invalid = [{}];
  expect(getCurrentDataIndex(invalid, 0.0)).toEqual(null);
});

it('gets file name', () => {
  const json = 'name.json'
  expect(getFileIndex(json)).toEqual('name');
  const svg = 'name.svg';
  expect(getFileIndex(svg)).toEqual('name');
  const xml = 'name.xml';
  expect(getFileIndex(xml)).toEqual('name');
});

it('gets file type', () => {
  const json = 'name.json'
  expect(getFileType(json)).toEqual('json');
  const svg = 'name.svg';
  expect(getFileType(svg)).toEqual('text');
  const xml = 'name.xml';
  expect(getFileType(xml)).toEqual('text');
});
