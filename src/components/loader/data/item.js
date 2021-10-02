import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import './index.scss';

const TRANSITION = .5;

const propTypes = {
  icon: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string,
  ]),
};

const defaultProps = {
  icon: '',
  value: false,
};

const Item = ({
  icon,
  value,
}) => {

  return (
    <div
      className={cx('item', { loaded: value })}
      style={{ transition: `opacity ${TRANSITION}s ease-in` }}
    >
      <div className={`icon-${icon}`} />
    </div>
  );
};

Item.propTypes = propTypes;
Item.defaultProps = defaultProps;

export default Item;
