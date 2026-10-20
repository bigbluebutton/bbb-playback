import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Icon from 'components/utils/icon';
import { ID } from 'utils/constants';
import { buildFileURL } from 'utils/data';
import './index.scss';

const propTypes = {
  alt: PropTypes.string,
  height: PropTypes.number,
  src: PropTypes.string,
  width: PropTypes.number,
};

const defaultProps = {
  alt: '',
  height: undefined,
  src: '',
  width: undefined,
};

const Image = ({
  alt,
  height,
  src,
  width,
}) => {
  const screenshare = src === ID.SCREENSHARE;

  if (screenshare) {
    return (
      <div className={cx('thumbnail-image', { screenshare })}>
        <Icon name={ID.SCREENSHARE} />
      </div>
    );
  }

  const logo = src.includes('logo');

  return (
    <img
      alt={alt}
      className={cx('thumbnail-image', { logo })}
      decoding="async"
      height={height}
      loading="lazy"
      src={buildFileURL(src)}
      width={width}
    />
  );
};

Image.propTypes = propTypes;
Image.defaultProps = defaultProps;

export default Image;
