import React from 'react';
import PropTypes from 'prop-types';
import Image from './image';
import './index.scss';

const propTypes = {
  alt: PropTypes.string,
  index: PropTypes.number,
  recordId: PropTypes.string,
  src: PropTypes.string,
};

const defaultProps = {
  alt: '',
  index: 0,
  recordId: '',
  src: '',
};

const Thumbnail = ({
  alt,
  index,
  recordId,
  src,
}) => {

  return (
    <div className="thumbnail">
      <Image
        alt={alt}
        recordId={recordId}
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
