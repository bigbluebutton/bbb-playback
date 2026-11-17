import React from 'react';
import PropTypes from 'prop-types';
import Image from './image';
import './index.scss';

const propTypes = {
  alt: PropTypes.string,
  height: PropTypes.number,
  index: PropTypes.number,
  src: PropTypes.string,
  width: PropTypes.number,
};

const defaultProps = {
  alt: '',
  height: undefined,
  index: 0,
  src: '',
  width: undefined,
};

const Thumbnail = ({
  alt,
  height,
  index,
  src,
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
      <div className="thumbnail-index">
        {index + 1}
      </div>
    </div>
  )
};

Thumbnail.propTypes = propTypes;
Thumbnail.defaultProps = defaultProps;

export default Thumbnail;
