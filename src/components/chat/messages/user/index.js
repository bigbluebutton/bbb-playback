import React from 'react';
import PropTypes from 'prop-types';
import Text from './text';
import Message from 'components/chat/messages/message';

const propTypes = {
  active: PropTypes.bool,
  hyperlink: PropTypes.bool,
  initials: PropTypes.string,
  name: PropTypes.string,
  text: PropTypes.string,
  timestamp: PropTypes.timestamp,
};

const defaultProps = {
  active: false,
  hyperlink: false,
  initials: '',
  name: '',
  text: '',
  timestamp: 0,
};

const User = ({
  active,
  hyperlink,
  initials,
  name,
  text,
  timestamp,
}) => {

  return (
    <Message
      active={active}
      circle
      initials={initials}
      name={name}
      timestamp={timestamp}
    >
      <Text
        active={active}
        hyperlink={hyperlink}
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
