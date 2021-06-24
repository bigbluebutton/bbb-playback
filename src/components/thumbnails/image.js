import React from 'react';
import cx from 'classnames';
import {
  ID,
  buildFileURL,
} from 'utils/data';
import './index.scss';

const Image = ({ alt, src, recordId }) => {
  const screenshare = src === ID.SCREENSHARE;

  if (screenshare) {
    return (
      <div className={cx('thumbnail-image', { screenshare })}>
        <span className="icon-screenshare" />
      </div>
    );
  }

  const logo = src.includes('logo');

  return (
    <img
      alt={alt}
      className={cx('thumbnail-image', { logo })}
      src={buildFileURL(recordId, src)}
    />
  );
};

export default Image;
