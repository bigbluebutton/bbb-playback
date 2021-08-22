import React from 'react';
import PropTypes from 'prop-types';
import BaseMessage from 'components/chat/messages/message';
import './index.scss';

const propTypes = {
  active: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  icon: PropTypes.string,
  name: PropTypes.string,
  player: PropTypes.object,
  timestamp: PropTypes.number,
};

const defaultProps = {
  active: false,
  children: null,
  icon: '',
  name: '',
  player: {},
  timestamp: 0,
};

const Message = ({
  active,
  children,
  icon,
  name,
  player,
  timestamp,
}) => {

  return (
    <BaseMessage
      active={active}
      icon={icon}
      name={name}
      player={player}
      timestamp={timestamp}
    >
      <div className="system-message-wrapper">
        {children}
      </div>
    </BaseMessage>
  );
};

Message.propTypes = propTypes;
Message.defaultProps = defaultProps;

export default Message;
