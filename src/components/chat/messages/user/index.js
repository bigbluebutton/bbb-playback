import React from 'react';
import PropTypes from 'prop-types';
import Text from './text';
import Message from 'components/chat/messages/message';

const propTypes = {
  active: PropTypes.bool,
  hyperlink: PropTypes.bool,
  initials: PropTypes.string,
  name: PropTypes.string,
  player: PropTypes.object,
  text: PropTypes.string,
  timestamp: PropTypes.timestamp,
};

const defaultProps = {
  active: false,
  hyperlink: false,
  initials: '',
  name: '',
  player: {},
  text: '',
  timestamp: 0,
};

const User = ({
  active,
  hyperlink,
  initials,
  name,
  player,
  text,
  timestamp,
}) => {

  return (
    <Message
      active={active}
      initials={initials}
      name={name}
      player={player}
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

  if (!prevProps.player && nextProps.player) return false;

  return true;
};

export default React.memo(User, areEqual);
