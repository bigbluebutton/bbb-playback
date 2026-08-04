import { useState, useEffect } from 'react';
import {
  EVENTS,
  ID,
} from 'utils/constants';
import {
  getCurrentContent,
  getCurrentDataIndex,
  getCurrentDataInterval,
} from 'utils/data';
import storage from 'utils/data/storage';
import { isEqual, getLayoutEvent } from 'utils/data/validators';

const useCurrentContent = () => {
  const [currentContent, setCurrentContent] = useState(ID.PRESENTATION);

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
  const [layoutSwap, setLayoutSwap] = useState({
    showPresentation: true,
    showScreenshare: false,
  });

  useEffect(() => {
    const handleTimeUpdate = (event) => {
      const layoutEvent = getLayoutEvent(storage.layoutSwap, event.detail.time);
      const nextShowPresentation = layoutEvent ? layoutEvent.showPresentation : true;
      const nextShowScreenshare = layoutEvent ? layoutEvent.showScreenshare : false;

      if (layoutSwap.showPresentation !== nextShowPresentation || layoutSwap.showScreenshare !== nextShowScreenshare) {
        setLayoutSwap({
          showPresentation: nextShowPresentation,
          showScreenshare: nextShowScreenshare,
        });
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
