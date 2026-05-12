import { ID } from 'utils/constants';
import { isEnabled } from 'utils/data/validators';

const isLayoutEvent = item => item && Object.hasOwn(item, 'showScreenshare');

const buildSwapThumbnail = (item, index, arr, screenshare) => {
  const previousItem = arr[index - 1];
  const nextItem = arr[index + 1];

  // Handle logic when screenshare is inactive (restore presentation)
  if (!item.showScreenshare) {
    // Prevent duplicate consecutive 'restore' actions
    if (
      isLayoutEvent(previousItem)
      && !previousItem.showScreenshare
    ) {
      return null;
    }

    const previousThumbs = arr.slice(0, index);
    const restoredSlide = previousThumbs.find((t) => t.src && t.src !== ID.SCREENSHARE);

    // Only add if the restored slide is different from the immediate previous item
    if (restoredSlide?.src && restoredSlide?.src !== previousItem?.src) {
      return {
        ...item,
        src: restoredSlide.src,
        alt: restoredSlide.alt ?? '',
      };
    }
    return null;
  }

  // Handle logic when screenshare is active
  if (item.showScreenshare) {
    if (!isEnabled(screenshare, item.timestamp)) {
      return null;
    }

    // Prevent duplicate consecutive 'screenshare' actions
    if (
      isLayoutEvent(previousItem)
      && previousItem.showScreenshare
    ) {
      return null;
    }

    // Ensure strictly valid boundaries (must have valid next/prev items)
    const hasValidNeighbors =
      (nextItem && nextItem.src !== ID.SCREENSHARE) &&
      (previousItem && previousItem.src !== ID.SCREENSHARE);

    if (hasValidNeighbors) {
      return {
        ...item,
        src: ID.SCREENSHARE,
        alt: ID.SCREENSHARE,
      };
    }
  }

  return null;
};

export const buildThumbnailItems = (thumbnails, layoutSwap = [], screenshare = []) => {
  const layoutEvents = (layoutSwap ?? []).filter(isLayoutEvent);
  const merged = [...thumbnails, ...layoutEvents];
  const sorted = merged.sort((a, b) => a.timestamp - b.timestamp);

  const addThumbsForSwap = sorted.map((item, index, arr) => {
    // If the item is a standard thumbnail (not a layout event), preserve it.
    if (!isLayoutEvent(item)) {
      return item;
    }

    return buildSwapThumbnail(item, index, arr, screenshare);
  }).filter((item) => item !== null);

  // Re-index all items sequentially
  return addThumbsForSwap.map((item, index) => ({
    ...item,
    id: index + 1,
  }));
};
