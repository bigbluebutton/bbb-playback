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
  let element;
  if (typeof value === 'boolean') {
    const icon = value ? 'icon-check' : 'icon-close';

    const style = {
      green: value,
      red: !value,
    };

    element = <div className={cx(icon, style)} />;
  } else {
    element = value;
  }

  return (
    <div className="item">
      <div className={`icon-${icon}`} />
      <div className="value">
        {element}
      </div>
    </div>
  );
};

Item.propTypes = propTypes;
Item.defaultProps = defaultProps;

export default Item;
