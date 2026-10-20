import React, { useEffect, useRef } from 'react';
import { EVENTS } from 'utils/constants';

// Fills while the current slide plays. Updated straight on the DOM so the
// thumbnails do not re-render on every time update
const Progress = ({ start, end }) => {
  const bar = useRef();

  useEffect(() => {
    const length = end - start;
    if (!Number.isFinite(length) || length <= 0) return;

    const handleTimeUpdate = (event) => {
      const ratio = Math.min(1, Math.max(0, (event.detail.time - start) / length));
      if (bar.current) bar.current.style.transform = `scaleX(${ratio})`;
    };

    document.addEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);

    return () => document.removeEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);
  }, [start, end]);

  return (
    <span
      aria-hidden="true"
      className="thumbnail-progress"
    >
      <span ref={bar} />
    </span>
  );
};

export default Progress;
