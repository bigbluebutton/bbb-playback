import React from 'react';
import Image from './image';
import './index.scss';

const Thumbnail = ({ alt, index, recordId, src }) => {

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

export default Thumbnail;
