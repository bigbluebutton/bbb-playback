import React from 'react';
import Proxy from './proxy';
import { useCurrentIndex } from 'components/utils/hooks';
import { buildFileURL } from 'utils/data';
import storage from 'utils/data/storage';

const Slide = () => {
  const currentIndex = useCurrentIndex(storage.slides);
  if (currentIndex === -1) return null;

  const {
    height,
    id,
    src,
    width,
  } = storage.slides[currentIndex];

  return (
    <g>
      <Proxy
        id={id}
        height={height}
        width={width}
      />
      <image
        height={height}
        href={buildFileURL(src)}
        x={0}
        width={width}
        y={0}
      />
    </g>
  );
};

const areEqual = () => true;

export default React.memo(Slide, areEqual);
