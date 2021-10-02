import React from 'react';
import { ID } from 'utils/constants';
import { buildFileURL } from 'utils/data';
import storage from 'utils/data/storage';
import './index.scss';

const Proxy = ({
  id,
  height,
  width,
}) => {
  const thumbnail = storage.thumbnails.find(thumbnails => id === thumbnails.id);
  if (!thumbnail) return null;

  const {
    alt,
    src,
  } = thumbnail;

  if (src === ID.SCREENSHARE) return null;

  return (
    <foreignObject
      height={height}
      x={0}
      width={width}
      y={0}
    >
      <img
        alt={alt}
        className="proxy"
        src={buildFileURL(src)}
      />
    </foreignObject>
  );
};

export default Proxy;
