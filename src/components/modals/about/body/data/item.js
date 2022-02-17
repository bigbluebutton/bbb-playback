import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'components/utils/icon';

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
    element = <Icon name={value ? 'check' : 'close'} />;
  } else {
    element = value;
  }

  return (
    <div className="item">
      <Icon name={icon} />
      {element}
    </div>
  );
};

Item.propTypes = propTypes;
Item.defaultProps = defaultProps;

export default Item;
