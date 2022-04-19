import {
  getBar,
//  getCurrentContent,
  getCurrentDataIndex,
  getCurrentDataInterval,
  getFileType,
  getMessageType,
  getPercentage,
  getPollLabel,
} from '.';
import { ID } from 'utils/constants';

it('get a poll bar from a percentage value', () => {
  expect(getBar(0))
    .toEqual('-');
  expect(getBar(12.5))
    .toEqual('█');
  expect(getBar(25))
    .toEqual('██▌');
  expect(getBar(50))
    .toEqual('█████');
  expect(getBar(75))
    .toEqual('███████▌');
  expect(getBar(87.5))
    .toEqual('████████▌');
  expect(getBar(100))
    .toEqual('██████████');
});

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

  // Single
  expect(getCurrentDataIndex([{ timestamp: 1.0 }], 0.0)).toEqual(-1);
  expect(getCurrentDataIndex([{ timestamp: 1.0 }], 1.0)).toEqual(0);
  expect(getCurrentDataIndex([{ timestamp: 1.0 }], 2.0)).toEqual(0);

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

it('gets file type', () => {
  const json = 'name.json'
  expect(getFileType(json)).toEqual('json');
  const svg = 'name.svg';
  expect(getFileType(svg)).toEqual('svg');
  const xml = 'name.xml';
  expect(getFileType(xml)).toEqual('xml');
  const html = 'name.html';
  expect(getFileType(html)).toEqual('html');
});

it('gets the chat message type', () => {
  expect(getMessageType({ message: 'message' })).toEqual(ID.USERS);
  expect(getMessageType({ question: 'question' })).toEqual(ID.POLLS);
  expect(getMessageType({})).toEqual('undefined');
});

it('gets the percentage representation of a value as string', () => {
  expect(getPercentage(0, 10)).toEqual('0.0');
  expect(getPercentage(5, 10)).toEqual('50.0');
  expect(getPercentage(9.9, 10)).toEqual('99.0');
  expect(getPercentage(25, 10)).toEqual('250.0');
});

it('gets the locale id for a poll label', () => {
  expect(getPollLabel('Yes', 'YN')).toEqual('yes');
  expect(getPollLabel('No', 'YN')).toEqual('no');
  expect(getPollLabel('Other', 'YN')).toEqual(null);
  expect(getPollLabel('Yes', 'YNA')).toEqual('yes');
  expect(getPollLabel('No', 'YNA')).toEqual('no');
  expect(getPollLabel('Abstention', 'YNA')).toEqual('abstention');
  expect(getPollLabel('True', 'TF')).toEqual('true');
  expect(getPollLabel('False', 'TF')).toEqual('false');
  expect(getPollLabel('Other', 'TF')).toEqual(null);
  expect(getPollLabel('True', 'X')).toEqual(null);
});
