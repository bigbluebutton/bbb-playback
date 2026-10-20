import {
  getNextRate,
  search,
} from './actions';

it('searches text in data collection', () => {
  const thumbnails = [
    { alt: 'some text', timestamp: 1.0 },
    { alt: 'SOME TEXT', timestamp: 2.0 },
    { alt: 'text', timestamp: 3.0 },
    { alt: 'TEXT', timestamp: 4.0 },
  ];

  // Match
  expect(search('some', thumbnails)).toEqual([ 0, 1 ]);
  expect(search('SOME', thumbnails)).toEqual([ 0, 1 ]);
  expect(search('text', thumbnails)).toEqual([ 0, 1, 2, 3 ]);
  expect(search('TEXT', thumbnails)).toEqual([ 0, 1, 2, 3 ]);

  // Miss
  expect(search('other', thumbnails)).toEqual([]);
});

it('steps through the playback rates', () => {
  const rates = [0.5, 1, 1.25, 1.5, 1.75, 2];

  expect(getNextRate(rates, 1, +1)).toBe(1.25);
  expect(getNextRate(rates, 1, -1)).toBe(0.5);
  expect(getNextRate(rates, 2, +1)).toBe(2);
  expect(getNextRate(rates, 0.5, -1)).toBe(0.5);
  // A speed set elsewhere snaps to the neighbours
  expect(getNextRate(rates, 1.1, +1)).toBe(1.25);
  expect(getNextRate(rates, 1.1, -1)).toBe(1);
});
