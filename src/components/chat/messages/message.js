import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Info from './info';
import Margin from './margin';
import './index.scss';

const propTypes = {
  active: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  circle: PropTypes.bool,
  icon: PropTypes.string,
  initials: PropTypes.string,
  name: PropTypes.string,
  player: PropTypes.object,
  timestamp: PropTypes.number,
};

const defaultProps = {
  active: false,
  children: null,
  circle: false,
  icon: '',
  initials: '',
  name: '',
  player: {},
  timestamp: 0,
};

const Message = ({
  active,
  children,
  circle,
  icon,
  initials,
  name,
  player,
  timestamp,
}) => {
  const handleOnClick = () => {
    if (player) player.currentTime(timestamp);
  };

  return (
    <div className="message">
      <Margin
        active={active}
        circle={circle}
        icon={icon}
        initials={initials}
        name={name}
        onClick={() => handleOnClick()}
      />
      <div className="data">
        <Info
          active={active}
          name={name}
          timestamp={timestamp}
        />
        <div className={cx('text', { inactive: !active })}>
          {children}
        </div>
      </div>
    </div>
  );
};

Message.propTypes = propTypes;
Message.defaultProps = defaultProps;

export default Message;
