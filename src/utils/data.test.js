import {
  getCurrentDataIndex,
  getFileName,
  getFileType,
  getRecordId,
  getScrollTop,
  getTimeAsString,
  isActive,
  isEnabled,
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
  expect(getCurrentDataIndex(data, 2.0)).toEqual(1);
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

it('gets time as a string', () => {
  // Second
  expect(getTimeAsString(-1)).toEqual(null);
  expect(getTimeAsString(0)).toEqual('00:00:00');
  expect(getTimeAsString(1)).toEqual('00:00:01');
  // Minute
  expect(getTimeAsString(59)).toEqual('00:00:59');
  expect(getTimeAsString(60)).toEqual('00:01:00');
  expect(getTimeAsString(61)).toEqual('00:01:01');
  // Hour
  expect(getTimeAsString(3599)).toEqual('00:59:59');
  expect(getTimeAsString(3600)).toEqual('01:00:00');
  expect(getTimeAsString(3601)).toEqual('01:00:01');
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
