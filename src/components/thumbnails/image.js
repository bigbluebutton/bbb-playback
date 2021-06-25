import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import {
  ID,
  buildFileURL,
} from 'utils/data';
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

const Image = (props) => {
  const screenshare = props.src === ID.SCREENSHARE;

  if (screenshare) {
    return (
      <div className={cx('thumbnail-image', { screenshare })}>
        <span className="icon-screenshare" />
      </div>
    );
  }

  const logo = props.src.includes('logo');

  return (
    <img
      alt={props.alt}
      className={cx('thumbnail-image', { logo })}
      src={buildFileURL(props.recordId, props.src)}
    />
  );
};

Image.propTypes = propTypes;
Image.defaultProps = defaultProps;

export default Image;
