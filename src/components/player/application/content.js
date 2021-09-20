import React from 'react';
import Chat from 'components/chat';
import Notes from 'components/notes';
import { ID } from 'utils/constants';

const Content = ({ current }) => {
  switch (current) {
    case ID.CHAT:

      return <Chat />;
    case ID.NOTES:

      return <Notes />;
    default:

      return null;
  }
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.current !== nextProps.current) return false;

  return true;
};

export default React.memo(Content, areEqual);
