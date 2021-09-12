import React from 'react';
import Proxy from './proxy';
import { buildFileURL } from 'utils/data';
import storage from 'utils/data/storage';

const Slide = ({ id }) => {
  const current = storage.shapes.slides.find(slide => id === slide.id);
  if (!current) return null;

  const {
    height,
    src,
    width,
  } = current;

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

const areEqual = (prevProps, nextProps) => {
  return prevProps.id === nextProps.id;
};

export default React.memo(Slide, areEqual);
