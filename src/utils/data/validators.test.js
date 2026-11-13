import {
  hasProperty,
  isActive,
  isEmpty,
  isEnabled,
} from './validators';

it('checks if object has property', () => {
  const object = { property: 'value' };

  expect(hasProperty(object, 'property')).toEqual(true);
  expect(hasProperty(object, undefined)).toEqual(false);

  const missing = { property: undefined };
  expect(hasProperty(missing, 'property')).toEqual(false);
  expect(hasProperty(missing, undefined)).toEqual(false);

  const empty = {};
  expect(hasProperty(empty, 'property')).toEqual(false);
  expect(hasProperty(empty, undefined)).toEqual(false);
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

it('checks if data array is empty', () => {
  // Array
  expect(isEmpty([1])).toEqual(false);
  expect(isEmpty([])).toEqual(true);

  // String
  expect(isEmpty('a')).toEqual(false);
  expect(isEmpty('')).toEqual(true);

  // Invalid
  expect(isEmpty(1)).toEqual(true);
});

it('checks if data is enabled', () => {
  const data = [
    { timestamp: 1.0, clear: 2.0 },
    { timestamp: 3.0, clear: 4.0 },
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
