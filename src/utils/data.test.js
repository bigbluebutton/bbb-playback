import {
  getCurrentDataIndex,
  getCurrentDataInterval,
  getFileName,
  getFileType,
  getRecordId,
  getScrollTop,
  isActive,
  isEnabled,
  parseTimeToSeconds,
} from './data';

it('gets current data index', () => {
  const data = [
    { timestamp: 1.0 },
    { timestamp: 2.0 },
  ];

  // Under
  expect(getCurrentDataIndex(data, 0.0)).toEqual(-1);

  // Bottom boundary
  expect(getCurrentDataIndex(data, 0.9)).toEqual(-1);
  expect(getCurrentDataIndex(data, 1.0)).toEqual(0);

  // Top boundary
  expect(getCurrentDataIndex(data, 2.0)).toEqual(1);
  expect(getCurrentDataIndex(data, 2.1)).toEqual(1);

  // Above
  expect(getCurrentDataIndex(data, 3.0)).toEqual(1);

  const empty = [];
  expect(getCurrentDataIndex(empty, 0.0)).toEqual(-1);

  const object = { timestamp: 1.2 };
  expect(getCurrentDataIndex(object, 0.0)).toEqual(-1);

  const invalid = [{}];
  expect(getCurrentDataIndex(invalid, 0.0)).toEqual(-1);
});

it('gets current data interval', () => {
  const data = [
    { timestamp: 1.0, clear: -1 },
    { timestamp: 2.0, clear: 3.0 },
    { timestamp: 3.0, clear: 5.0 },
    { timestamp: 4.0, clear: -1 },
    { timestamp: 5.0, clear: 6.0 },
  ];

  let result = [];
  expect(getCurrentDataInterval(data, 0.0)).toEqual(result);
  expect(getCurrentDataInterval(data, 0.9)).toEqual(result);

  result = [ true ];
  expect(getCurrentDataInterval(data, 1.0)).toEqual(result);

  result = [ true, true ];
  expect(getCurrentDataInterval(data, 2.0)).toEqual(result);
  expect(getCurrentDataInterval(data, 2.1)).toEqual(result);
  expect(getCurrentDataInterval(data, 2.9)).toEqual(result);

  result = [ true, false, true ];
  expect(getCurrentDataInterval(data, 3.0)).toEqual(result);
  expect(getCurrentDataInterval(data, 3.1)).toEqual(result);
  expect(getCurrentDataInterval(data, 3.9)).toEqual(result);

  result = [ true, false, true, true ];
  expect(getCurrentDataInterval(data, 4.0)).toEqual(result);
  expect(getCurrentDataInterval(data, 4.9)).toEqual(result);

  result = [ true, false, false, true, true ];
  expect(getCurrentDataInterval(data, 5.0)).toEqual(result);

  result = [ true, false, false, true, false ];
  expect(getCurrentDataInterval(data, 6.0)).toEqual(result);

  const empty = [];
  expect(getCurrentDataInterval(empty, 0.0)).toEqual([]);

  const object = { timestamp: 1.2 };
  expect(getCurrentDataInterval(object, 0.0)).toEqual([]);

  const invalid = [{}];
  expect(getCurrentDataInterval(invalid, 0.0)).toEqual([]);
});

it('gets file name', () => {
  const json = 'name.json'
  expect(getFileName(json)).toEqual('name');
  const svg = 'name.svg';
  expect(getFileName(svg)).toEqual('name');
  const xml = 'name.xml';
  expect(getFileName(xml)).toEqual('name');
});

it('gets file type', () => {
  const json = 'name.json'
  expect(getFileType(json)).toEqual('json');
  const svg = 'name.svg';
  expect(getFileType(svg)).toEqual('text');
  const xml = 'name.xml';
  expect(getFileType(xml)).toEqual('text');
});

it('gets record id', () => {
  expect(getRecordId({
    params: {
      recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f3-1574371932088',
    },
  })).toEqual('b818cb74f8dd98e1b91d0da6deb2284c04f313f3-1574371932088');

  // an{41}-n{13}
  expect(getRecordId({
    params: {
      recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f3a-1574371932088',
    },
  })).toEqual(null);

  // an{39}-n{13}
  expect(getRecordId({
    params: {
      recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f-1574371932088',
    },
  })).toEqual(null);

  // an{40}-n{14}
  expect(getRecordId({
    params: {
      recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f3-15743719320880',
    },
  })).toEqual(null);

  // an{40}-n{12}
  expect(getRecordId({
    params: {
      recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f3-157437193208',
    },
  })).toEqual(null);

  // an{40}-an{13}
  expect(getRecordId({
    params: {
      recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f3-157437193208a',
    },
  })).toEqual(null);

  // an{40}n{12}
  expect(getRecordId({
    params: {
      recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f31574371932088',
    },
  })).toEqual(null);

  // an{40}/n{12}
  expect(getRecordId({
    params: {
      recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f3/1574371932088',
    },
  })).toEqual(null);

  // Missing recordId
  expect(getRecordId({ params: {}})).toEqual(null);

  // Missing params
  expect(getRecordId({})).toEqual(null);
});

it('checks if data item is active', () => {
  // Not cleared
  expect(isActive(0.9, 1.0)).toEqual(false);
  expect(isActive(1.0, 1.0)).toEqual(true);
  expect(isActive(1.1, 1.0)).toEqual(true);

  // Cleared
  expect(isActive(1.0, 1.0, 1.1)).toEqual(true);
  expect(isActive(1.1, 1.0, 1.1)).toEqual(false);
  expect(isActive(1.2, 1.0, 1.1)).toEqual(false);
});

it('checks if data is enabled', () => {
  const data = [
    {
      timestamp: 1.0,
      clear: 2.0,
    },
    {
      timestamp: 3.0,
      clear: 4.0,
    },
  ];

  // Under
  expect(isEnabled(data, 0.0)).toEqual(false);

  // First bottom boundary
  expect(isEnabled(data, 0.9)).toEqual(false);
  expect(isEnabled(data, 1.0)).toEqual(true);

  // First top boundary
  expect(isEnabled(data, 1.9)).toEqual(true);
  expect(isEnabled(data, 2.0)).toEqual(false);

  // Second bottom boundary
  expect(isEnabled(data, 2.9)).toEqual(false);
  expect(isEnabled(data, 3.0)).toEqual(true);

  // Second top boundary
  expect(isEnabled(data, 3.9)).toEqual(true);
  expect(isEnabled(data, 4.0)).toEqual(false);

  // Above
  expect(isEnabled(data, 5.0)).toEqual(false);

  const empty = [];
  expect(isEnabled(empty, 0.0)).toEqual(false);

  const object = { timestamp: 1.2 };
  expect(isEnabled(object, 0.0)).toEqual(false);

  const missing = [{ timestamp: 1.2 }];
  expect(isEnabled(missing, 0.0)).toEqual(false);

  const invalid = [{}];
  expect(isEnabled(invalid, 0.0)).toEqual(false);
});

it('gets the vertical offset of a scrollable list', () => {
  const parentNode = { clientHeight: 100 };
  const firstNode = { offsetTop: 0 };
  const currentNode = {
    clientHeight: 10,
    offsetTop: 100,
    parentNode,
  };

  // TODO: Add more tests
  expect(getScrollTop(firstNode, currentNode, 'top')).toEqual(100);
  expect(getScrollTop(firstNode, currentNode, 'center')).toEqual(55);
  expect(getScrollTop(firstNode, currentNode, 'bottom')).toEqual(10);
});

it('parses time query to seconds', () => {
  expect(parseTimeToSeconds('1h0m0s')).toEqual(3600);
  expect(parseTimeToSeconds('1h0m1s')).toEqual(3601);
  expect(parseTimeToSeconds('1h1m0s')).toEqual(3660);
  expect(parseTimeToSeconds('1h1m1s')).toEqual(3661);
  expect(parseTimeToSeconds('1m0s')).toEqual(60);
  expect(parseTimeToSeconds('1m1s')).toEqual(61);
  expect(parseTimeToSeconds('1s')).toEqual(1);

  expect(parseTimeToSeconds('59s')).toEqual(59);
  expect(parseTimeToSeconds('60s')).toEqual(null);
  expect(parseTimeToSeconds('-1s')).toEqual(null);

  expect(parseTimeToSeconds('59m0s')).toEqual(3540);
  expect(parseTimeToSeconds('60m0s')).toEqual(null);
  expect(parseTimeToSeconds('-1m0s')).toEqual(null);

  expect(parseTimeToSeconds('1h')).toEqual(null);
  expect(parseTimeToSeconds('1h0m')).toEqual(null);
  expect(parseTimeToSeconds('1h0s')).toEqual(null);

  expect(parseTimeToSeconds('1m')).toEqual(null);

  expect(parseTimeToSeconds('1s0m0h')).toEqual(null);
  expect(parseTimeToSeconds('0m0h1s')).toEqual(null);
  expect(parseTimeToSeconds('0h1s0m')).toEqual(null);
  expect(parseTimeToSeconds('1m0h')).toEqual(null);
  expect(parseTimeToSeconds('1s0m')).toEqual(null);
});
