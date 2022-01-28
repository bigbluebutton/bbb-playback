import React from 'react';
import PropTypes from 'prop-types';
import { chat as config } from 'config';
import Text from './text';
import Message from 'components/chat/messages/message';

const propTypes = {
  active: PropTypes.bool,
  hyperlink: PropTypes.bool,
  initials: PropTypes.string,
  moderator: PropTypes.bool,
  name: PropTypes.string,
  text: PropTypes.string,
  timestamp: PropTypes.timestamp,
};

const defaultProps = {
  active: false,
  hyperlink: false,
  initials: '',
  moderator: false,
  name: '',
  text: '',
  timestamp: 0,
};

const User = ({
  active,
  hyperlink,
  initials,
  moderator,
  name,
  text,
  timestamp,
}) => {

  return (
    <Message
      active={active}
      circle={!moderator}
      initials={initials}
      name={name}
      timestamp={timestamp}
    >
      <Text
        active={active}
        emphasize={config.emphasize && moderator}
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
