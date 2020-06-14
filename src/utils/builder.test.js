import {
  buildStyle,
  decodeXML,
  getAttr,
  getId,
  getNumbers,
} from './builder';

it('builds style object from a string', () => {
  let value = 'first: 1; second: two; visibility: hidden;';
  expect(buildStyle(value)).toEqual({ first: '1', second: 'two' });

  value = 'first: 1;';
  expect(buildStyle(value)).toEqual({ first: '1' });

  value = 'first: 1';
  expect(buildStyle(value)).toEqual({ first: '1' });

  value = '; second: two;';
  expect(buildStyle(value)).toEqual({ second: 'two' });

  value = 'visibility: hidden;';
  expect(buildStyle(value)).toEqual({});
});

it('decodes XML predefined entities to character', () => {
  const entities = {
    'quot': `"`,
    '#34': `"`,
    'amp': `&`,
    '#38': `&`,
    'apos': `'`,
    '#39': `'`,
    'lt': `<`,
    '#60': `<`,
    'gt': `>`,
    '#62': `>`,
  };

  for (let entity in entities) {
    if (Object.prototype.hasOwnProperty.call(entities, entity)) {
      expect(decodeXML(`&${entity};`)).toEqual(`${entities[entity]}`);
      expect(decodeXML(` &${entity};`)).toEqual(` ${entities[entity]}`);
      expect(decodeXML(`&${entity}; `)).toEqual(`${entities[entity]} `);
      expect(decodeXML(`&${entity};&${entity};`))
        .toEqual(`${entities[entity]}${entities[entity]}`);
      expect(decodeXML(`&${entity}; &${entity};`))
        .toEqual(`${entities[entity]} ${entities[entity]}`);
    }
  }
});

it('gets attributes from a parsed xml node', () => {
  const attr = { first: 1, second: 'two' };

  expect(getAttr({ '$': attr })).toEqual(attr);
  expect(getAttr({ '$': attr, '%': null })).toEqual(attr);
  expect(getAttr({ '%': null })).toEqual({});
  expect(getAttr({})).toEqual({});
});

it('gets a numeric id from a string', () => {
  // Regular
  expect(getId('id1')).toEqual(1);
  expect(getId('1')).toEqual(1);
  expect(getId('id10')).toEqual(10);
  expect(getId('10')).toEqual(10);

  // Mixed
  expect(getId('0id1')).toEqual(1);
  expect(getId('00id11')).toEqual(11);

  // Invalid
  expect(getId('1id')).toEqual(-1);
  expect(getId('i1d')).toEqual(-1);
  expect(getId('id')).toEqual(-1);
  expect(getId('')).toEqual(-1);
  expect(getId()).toEqual(-1);
});

it('gets a numeric array from a string', () => {
  // Integer
  expect(getNumbers('1 2 3')).toEqual([1.0, 2.0, 3.0]);
  expect(getNumbers('1')).toEqual([1.0]);
  expect(getNumbers(' 1 ')).toEqual([1.0]);
  expect(getNumbers('1  2  3')).toEqual([1.0, 2.0, 3.0]);

  // Float
  expect(getNumbers('1.1 2.2 3.3')).toEqual([1.1, 2.2, 3.3]);
  expect(getNumbers('1.1')).toEqual([1.1]);
  expect(getNumbers(' 1.1 ')).toEqual([1.1]);
  expect(getNumbers('1.1  2.2  3.3')).toEqual([1.1, 2.2, 3.3]);

  // Invalid
  expect(getNumbers('')).toEqual([]);
  expect(getNumbers(' ')).toEqual([]);
  expect(getNumbers()).toEqual([]);
});

