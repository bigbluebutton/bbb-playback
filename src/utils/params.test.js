import {
  parseRecordId,
  parseTimeToSeconds,
} from './params';

it('gets record id', () => {
  expect(parseRecordId({
    recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f3-1574371932088',
  })).toEqual('b818cb74f8dd98e1b91d0da6deb2284c04f313f3-1574371932088');

  // an{41}-n{13}
  expect(parseRecordId({
    recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f3a-1574371932088',
  })).toEqual(null);

  // an{39}-n{13}
  expect(parseRecordId({
    recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f-1574371932088',
  })).toEqual(null);

  // an{40}-n{14}
  expect(parseRecordId({
    recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f3-15743719320880',
  })).toEqual(null);

  // an{40}-n{12}
  expect(parseRecordId({
    recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f3-157437193208',
  })).toEqual(null);

  // an{40}-an{13}
  expect(parseRecordId({
    recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f3-157437193208a',
  })).toEqual(null);

  // an{40}n{12}
  expect(parseRecordId({
    recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f31574371932088',
  })).toEqual(null);

  // an{40}/n{12}
  expect(parseRecordId({
    recordId: 'b818cb74f8dd98e1b91d0da6deb2284c04f313f3/1574371932088',
  })).toEqual(null);

  // Missing recordId
  expect(parseRecordId({})).toEqual(null);

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
