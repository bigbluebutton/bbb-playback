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
  emphasised: PropTypes.bool,
  chatEmphasizedText: PropTypes.bool,
};

const defaultProps = {
  active: false,
  hyperlink: false,
  initials: '',
  name: '',
  text: '',
  timestamp: 0,
  emphasised: false,
  chatEmphasizedText: true,
};

const User = ({
  active,
  hyperlink,
  initials,
  name,
  text,
  timestamp,
  emphasised,
  chatEmphasizedText,
}) => {

  return (
    <Message
      active={active}
      circle={!emphasised}
      emphasised={emphasised}
      initials={initials}
      name={name}
      timestamp={timestamp}
    >
      <Text
        emphasised={emphasised}
        active={active}
        hyperlink={hyperlink}
        text={text}
        chatEmphasizedText={chatEmphasizedText}
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
