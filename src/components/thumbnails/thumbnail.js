import React from 'react';
import PropTypes from 'prop-types';
import Image from './image';
import './index.scss';

const propTypes = {
  alt: PropTypes.string,
  index: PropTypes.number,
  src: PropTypes.string,
};

const defaultProps = {
  alt: '',
  index: 0,
  src: '',
};

const Thumbnail = ({
  alt,
  index,
  src,
}) => {

  return (
    <div className="thumbnail">
      <Image
        alt={alt}
        src={src}
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
