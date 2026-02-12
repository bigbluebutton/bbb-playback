import React from 'react';
import PropTypes from 'prop-types';
import Text from './text';
import Message from 'components/chat/messages/message';

const propTypes = {
  active: PropTypes.bool,
  emphasized: PropTypes.bool,
  initials: PropTypes.string,
  name: PropTypes.string,
  moderator: PropTypes.bool,
  text: PropTypes.string,
  timestamp: PropTypes.timestamp,
};

const defaultProps = {
  active: false,
  emphasized: false,
  initials: '',
  name: '',
  moderator: false,
  text: '',
  timestamp: 0,
};

const User = ({
  active,
  emphasized,
  initials,
  name,
  moderator,
  text,
  edited,
  timestamp,
  messageToBeReplied,
  scrollTo,
  reactions,
}) => {

  return (
    <Message
      active={active}
      circle={!moderator}
      emphasized={emphasized}
      initials={initials}
      edited={edited}
      name={name}
      reactions={reactions}
      timestamp={timestamp}
      messageToBeReplied={messageToBeReplied}
      scrollTo={scrollTo}
    >
      <Text
        active={active}
        text={text}
      />

    </Message>
  );
};

User.propTypes = propTypes;
User.defaultProps = defaultProps;

// Checks the message active state
const areEqual = (prevProps, nextProps) => {
  if (prevProps.active !== nextProps.active) return false;

  return true;
};

export default React.memo(User, areEqual);
