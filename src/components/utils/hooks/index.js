import { useState, useEffect } from 'react';
import { EVENTS } from 'utils/constants';
import {
  getCurrentContent,
  getCurrentDataIndex,
  getCurrentDataInterval,
} from 'utils/data';
import storage from 'utils/data/storage';
import { getLayoutSwap, isEqual } from 'utils/data/validators';

// No time update is dispatched until playback starts, so without this the first
// render reports the presentation as the content even for a recording that begins
// with a screenshare, and only corrects itself once playback starts.
const INITIAL_TIME = 0;

const getLayoutSwapAt = (time) => getLayoutSwap(storage.layoutSwap, storage.screenshare, time);

const useCurrentContent = () => {
  const [currentContent, setCurrentContent] = useState(() => getCurrentContent(INITIAL_TIME));

  useEffect(() => {
    const handleTimeUpdate = (event) => {
      const nextContent = getCurrentContent(event.detail.time);
      if (currentContent !== nextContent) setCurrentContent(nextContent);
    };

    document.addEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);
    return () => {
      document.removeEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);
    };
  }, [currentContent]);

  return currentContent;
};

const useLayoutSwap = () => {
  const [layoutSwap, setLayoutSwap] = useState(() => getLayoutSwapAt(INITIAL_TIME));

  useEffect(() => {
    const handleTimeUpdate = (event) => {
      const next = getLayoutSwapAt(event.detail.time);

      if (layoutSwap.showPresentation !== next.showPresentation || layoutSwap.showScreenshare !== next.showScreenshare) {
        setLayoutSwap(next);
      }
    };

    document.addEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);
    return () => {
      document.removeEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);
    };
  }, [layoutSwap]);

  return layoutSwap;
}

const useCurrentIndex = (data) => {
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    const handleTimeUpdate = (event) => {
      const nextIndex = getCurrentDataIndex(data, event.detail.time);
      if (currentIndex !== nextIndex) setCurrentIndex(nextIndex);
    };

    document.addEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);
    return () => {
      document.removeEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);
    };
  }, [currentIndex, data]);

  return currentIndex;
};

const useCurrentInterval = (data) => {
  const [currentInterval, setCurrentInterval] = useState({ index: -1, interval: [] });

  useEffect(() => {
    const handleTimeUpdate = (event) => {
      const nextIndex = getCurrentDataIndex(data, event.detail.time);
      const sameIndex = currentInterval.index === nextIndex;

      if (nextIndex !== -1) {
        const nextInterval = getCurrentDataInterval(data[nextIndex].data, event.detail.time);
        const sameInterval = isEqual(currentInterval.interval, nextInterval);
        if (!sameIndex || !sameInterval) setCurrentInterval({ index: nextIndex, interval: nextInterval });
      } else {
        const sameInterval = isEqual(currentInterval, []);
        if (!sameIndex || !sameInterval) setCurrentInterval({ index: -1, interval: [] });
      }
    };

    document.addEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);
    return () => {
      document.removeEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);
    };
  }, [currentInterval, data]);

  return currentInterval;
};

export {
  useCurrentContent,
  useCurrentIndex,
  useCurrentInterval,
  useLayoutSwap,
};
