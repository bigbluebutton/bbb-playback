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
  timestamp: PropTypes.number,
};

const defaultProps = {
  active: false,
  children: null,
  icon: '',
  name: '',
  timestamp: 0,
};

const Message = ({
  active,
  children,
  icon,
  name,
  timestamp,
}) => {

  return (
    <BaseMessage
      active={active}
      icon={icon}
      name={name}
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
