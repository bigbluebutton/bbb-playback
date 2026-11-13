import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Icon from 'components/utils/icon';

const propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  state: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.string,
  ]),
};

const defaultProps = {
  icon: '',
  label: '',
  state: '',
  value: false,
};

// A tile per kind of content: on when the recording has it, or a count
const Item = ({
  icon,
  label,
  state,
  value,
}) => {
  const isCount = typeof value !== 'boolean';
  const available = isCount || value;

  return (
    <li className={cx('item', { unavailable: !available })}>
      <span className="item-icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <span className="item-label">{label}</span>
      {isCount ? (
        <span className="item-count">{value}</span>
      ) : (
        <span className="item-state">
          <span aria-hidden="true">
            <Icon name={value ? 'check' : 'close'} />
          </span>
          <span className="visually-hidden">{state}</span>
        </span>
      )}
    </li>
  );
};

Item.propTypes = propTypes;
Item.defaultProps = defaultProps;

export default Item;
