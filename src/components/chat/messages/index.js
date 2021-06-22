import React from 'react';
import UserMessage from './user';
import PollMessage from './poll';
import {
  ID,
  getMessageType,
} from 'utils/data';
import './index.scss';

const Messages = ({ chat, currentDataIndex, player, setInteraction, setRef }) => {

  const handleOnClick = (timestamp) => {
    if (player) player.currentTime(timestamp);
  };

  return (
    <div className="list">
      <div
        className="message-wrapper"
        onMouseEnter={() => setInteraction(true)}
        onMouseLeave={() => setInteraction(false)}
      >
        {chat.map((item, index) => {
          const active = index <= currentDataIndex;
          const { timestamp } = item;
          const type = getMessageType(item);
          switch (type) {
            case ID.USERS:

              return (
                <span ref={node => setRef(node, index)}>
                  <UserMessage
                    active={active}
                    hyperlink={item.hyperlink}
                    initials={item.initials}
                    name={item.name}
                    onClick={() => handleOnClick(timestamp)}
                    text={item.message}
                    timestamp={timestamp}
                  />
                </span>
              );
            case ID.POLLS:

              return (
                <span ref={node => setRef(node, index)}>
                  <PollMessage
                    active={active}
                    answers={item.answers}
                    onClick={() => handleOnClick(timestamp)}
                    question={item.question}
                    responders={item.responders}
                    timestamp={timestamp}
                    type={item.type}
                  />
                </span>
              );
            default:
              return <span ref={node => setRef(node, index)} />;
          }
        })};
      </div>
    </div>
  );
};

export default Messages;
