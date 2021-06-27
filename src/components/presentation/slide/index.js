import React from 'react';
import Proxy from './proxy';
import { buildFileURL } from 'utils/data';

const Slide = ({
  id,
  recordId,
  slides,
  thumbnails,
}) => {
  const current = slides.find(slide => id === slide.id);
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
        recordId={recordId}
        thumbnails={thumbnails}
        width={width}
      />
      <image
        height={height}
        href={buildFileURL(recordId, src)}
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
