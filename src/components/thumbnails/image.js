import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Icon from 'components/utils/icon';
import { ID } from 'utils/constants';
import { buildFileURL } from 'utils/data';
import './index.scss';

const propTypes = {
  alt: PropTypes.string,
  src: PropTypes.string,
};

const defaultProps = {
  alt: '',
  src: '',
};

const Image = ({
  alt,
  src,
}) => {
  const screenshare = src === ID.SCREENSHARE;

  if (screenshare) {
    return (
      <div className={cx('thumbnail-image', { screenshare })}>
        <Icon name={ID.SCREENSHARE} />
      </div>
    );
  }

  const external_video = src === ID.EXTERNAL_VIDEOS;

  if (external_video) {
    return (
      <div className={cx('thumbnail-image', { external_video })}>
        <Icon name={ID.EXTERNAL_VIDEOS} />
      </div>
    );
  }

  const logo = src.includes('logo');

  return (
    <img
      alt={alt}
      className={cx('thumbnail-image', { logo })}
      src={buildFileURL(src)}
    />
  );
};

Image.propTypes = propTypes;
Image.defaultProps = defaultProps;

export default Image;
