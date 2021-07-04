import React from 'react';
import cx from 'classnames';
import { ID } from 'utils/constants';
import { buildFileURL } from 'utils/data';
import './index.scss';

const Proxy = ({
  id,
  height,
  recordId,
  thumbnails,
  width,
}) => {
  const thumbnail = thumbnails.find(thumbnails => id === thumbnails.id);
  if (!thumbnail) return null;

  const {
    alt,
    src,
  } = thumbnail;

  if (src === ID.SCREENSHARE) return null;

  const logo = src.includes('logo');

  return (
    <foreignObject
      height={height}
      x={0}
      width={width}
      y={0}
    >
      <img
        alt={alt}
        className={cx('proxy', { logo })}
        src={buildFileURL(recordId, src)}
      />
    </foreignObject>
  );
};

export default Proxy;
