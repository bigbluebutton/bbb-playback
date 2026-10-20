import { ID } from 'utils/constants';
import { buildThumbnailItems } from './utils';

const sources = items => items.map(({ src }) => src);

it('restores the slide shown before a screenshare, not the first one', () => {
  const thumbnails = [
    { timestamp: 0, src: 'slide-1.png' },
    { timestamp: 10, src: 'slide-2.png' },
    { timestamp: 20, src: ID.SCREENSHARE },
  ];

  // The presentation is swapped back as content while still sharing
  const layoutSwap = [
    { timestamp: 20, showScreenshare: true },
    { timestamp: 25, showScreenshare: false },
  ];

  const screenshare = [{ timestamp: 20, clear: 60 }];

  expect(sources(buildThumbnailItems(thumbnails, layoutSwap, screenshare))).toEqual([
    'slide-1.png',
    'slide-2.png',
    ID.SCREENSHARE,
    'slide-2.png',
  ]);
});

it('adds no slide when a screenshare ends on the current slide', () => {
  const thumbnails = [
    { timestamp: 0, src: 'slide-1.png' },
    { timestamp: 10, src: ID.SCREENSHARE },
    { timestamp: 20, src: 'slide-1.png' },
    { timestamp: 30, src: 'slide-2.png' },
    { timestamp: 40, src: ID.SCREENSHARE },
    { timestamp: 50, src: 'slide-2.png' },
  ];

  const layoutSwap = [
    { timestamp: 10, showScreenshare: true },
    { timestamp: 20, showScreenshare: false },
    { timestamp: 40, showScreenshare: true },
    { timestamp: 50, showScreenshare: false },
  ];

  const screenshare = [
    { timestamp: 10, clear: 20 },
    { timestamp: 40, clear: 50 },
  ];

  expect(sources(buildThumbnailItems(thumbnails, layoutSwap, screenshare))).toEqual([
    'slide-1.png',
    ID.SCREENSHARE,
    'slide-1.png',
    'slide-2.png',
    ID.SCREENSHARE,
    'slide-2.png',
  ]);
});
