import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import './index.scss';

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
    <div className={cx('item', { loaded: value })}>
      <div className={`icon-${icon}`} />
    </div>
  );
};

Item.propTypes = propTypes;
Item.defaultProps = defaultProps;

export default Item;
