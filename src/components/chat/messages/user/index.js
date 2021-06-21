import React from 'react';
import Text from './text';
import Message from 'components/chat/messages/message';

const User = (props) => {
  const { active } = props;

  return (
    <Message
      active={active}
      initials={props.initials}
      onClick={props.onClick}
      name={props.name}
      timestamp={props.timestamp}
    >
      <Text
        active={active}
        hyperlink={props.hyperlink}
        text={props.text}
      />
    </Message>
  );
};

// Checks the message active state
const areEqual = (prevProps, nextProps) => {
  return prevProps.active === nextProps.active;
};

export default React.memo(User, areEqual);
