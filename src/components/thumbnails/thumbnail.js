import React from 'react';
import PropTypes from 'prop-types';
import Image from './image';
import { formatTime } from 'utils/format';
import './index.scss';

const propTypes = {
  alt: PropTypes.string,
  height: PropTypes.number,
  index: PropTypes.number,
  src: PropTypes.string,
  timestamp: PropTypes.number,
  width: PropTypes.number,
};

const defaultProps = {
  alt: '',
  height: undefined,
  index: 0,
  src: '',
  timestamp: undefined,
  width: undefined,
};

const Thumbnail = ({
  alt,
  height,
  index,
  src,
  timestamp,
  width,
}) => {

  return (
    <div className="thumbnail">
      <Image
        alt={alt}
        height={height}
        src={src}
        width={width}
      />
      <div className="thumbnail-footer">
        <span className="thumbnail-index">{index + 1}</span>
        {Number.isFinite(timestamp) ? (
          <bdi className="thumbnail-time">{formatTime(timestamp)}</bdi>
        ) : null}
      </div>
    </div>
  )
};

Thumbnail.propTypes = propTypes;
Thumbnail.defaultProps = defaultProps;

export default Thumbnail;
