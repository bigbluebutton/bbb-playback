import React from 'react';
import Text from './text';
import Message from 'components/chat/messages/message';

const User = (props) => {

  return (
    <Message
      active={props.active}
      initials={props.initials}
      name={props.name}
      player={props.player}
      timestamp={props.timestamp}
    >
      <Text
        active={props.active}
        hyperlink={props.hyperlink}
        text={props.text}
      />
    </Message>
  );
};

// Checks the message active state
const areEqual = (prevProps, nextProps) => {
  if (prevProps.active !== nextProps.active) return false;

  if (!prevProps.player && nextProps.player) return false;

  return true;
};

export default React.memo(User, areEqual);
