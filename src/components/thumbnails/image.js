import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { ID } from 'utils/constants';
import { buildFileURL } from 'utils/data';
import './index.scss';

const propTypes = {
  alt: PropTypes.string,
  src: PropTypes.string,
  recordId: PropTypes.string,
};

const defaultProps = {
  alt: '',
  src: '',
  recordId: '',
};

const Image = ({
  alt,
  src,
  recordId,
}) => {
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

Image.propTypes = propTypes;
Image.defaultProps = defaultProps;

export default Image;
