import { search } from './actions';

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
