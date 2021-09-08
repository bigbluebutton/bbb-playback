import React, { useState } from 'react';
import Content from './content';
import Control from './control';
import { ID } from 'utils/constants';
import './index.scss';

const DEFAULT = ID.CHAT;

const Application = ({
  chat,
  control,
  currentChatIndex,
  notes,
  player,
}) => {
  const [current, setCurrent] = useState(DEFAULT);

  const toggleApplication = (application) => {
    if (current !== application) setCurrent(application);
  };

  return (
    <div className="application">
      {control ? (
        <Control
          current={current}
          toggleApplication={toggleApplication}
        />
      ) : null}
      <Content
        chat={chat}
        current={current}
        currentChatIndex={currentChatIndex}
        notes={notes}
        player={player}
      />
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.currentChatIndex !== nextProps.currentChatIndex) return false;

  if (!prevProps.player && nextProps.player) return false;

  return true;
};

export default React.memo(Application, areEqual);
