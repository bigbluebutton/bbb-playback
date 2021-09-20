import { useState, useEffect } from 'react';
import { EVENTS } from 'utils/constants';
import { getCurrentDataIndex } from 'utils/data';

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

export {
  useCurrentIndex,
};
