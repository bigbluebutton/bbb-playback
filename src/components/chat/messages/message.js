import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Info from './info';
import Margin from './margin';
import player from 'utils/player';
import './index.scss';

const propTypes = {
  active: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  circle: PropTypes.bool,
  emphasized: PropTypes.bool,
  icon: PropTypes.string,
  initials: PropTypes.string,
  name: PropTypes.string,
  timestamp: PropTypes.number,
};

const defaultProps = {
  active: false,
  children: null,
  circle: false,
  emphasized: false,
  icon: '',
  initials: '',
  name: '',
  timestamp: 0,
};

const Message = ({
  active,
  children,
  circle,
  emphasized,
  icon,
  initials,
  name,
  timestamp,
}) => {
  const handleOnClick = () => {
    player.primary.currentTime(timestamp);
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
        <div className={cx('text', { inactive: !active, emphasized })}>
          {children}
        </div>
      </div>
    </div>
  );
};

Message.propTypes = propTypes;
Message.defaultProps = defaultProps;

export default Message;
