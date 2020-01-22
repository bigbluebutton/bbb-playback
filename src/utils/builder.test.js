import {
  buildStyle,
  getAttr,
  getId,
  getNumbers,
} from './builder';

it('builds style object from a string', () => {
});

it('gets attributes from a parsed xml node', () => {
});

it('gets a numeric id from a string', () => {
});

it('gets a numeric array from a string', () => {
  expect(getNumbers('1 2 3')).toEqual([1.0, 2.0, 3.0]);
  expect(getNumbers('1.1 2.2 3.3')).toEqual([1.1, 2.2, 3.3]);
  expect(getNumbers('1')).toEqual([1.0]);
  expect(getNumbers('1.1')).toEqual([1.1]);
  expect(getNumbers(' 1 ')).toEqual([1.0]);
  expect(getNumbers(' 1.1 ')).toEqual([1.1]);
  expect(getNumbers('1  2  3')).toEqual([1.0, 2.0, 3.0]);
  expect(getNumbers('1.1  2.2  3.3')).toEqual([1.1, 2.2, 3.3]);
  expect(getNumbers('')).toEqual([]);
  expect(getNumbers(' ')).toEqual([]);
  expect(getNumbers()).toEqual([]);
});

