import React from 'react';
import PropTypes from 'prop-types';
import UserMessage from './user';
import PollMessage from './system/poll';
import VideoMessage from './system/video';
import { ID } from 'utils/constants';
import { getMessageType } from 'utils/data';
import storage from 'utils/data/storage';
import './index.scss';

const propTypes = {
  currentIndex: PropTypes.number,
  setRef: PropTypes.func,
};

const defaultProps = {
  currentIndex: 0,
  setRef: () => { },
};

const Messages = ({
  currentIndex,
  scrollTo,
  setRef,
}) => {

  return (
    <div className="list">
      <div className="message-wrapper">
        {storage.messages.map((item, index) => {
          const active = index <= currentIndex;
          const { timestamp } = item;
          const type = getMessageType(item);
          switch (type) {
            case ID.USERS:

              const indexOfMessageToBeReplied = (item.replyToMessageId)
                ? storage.messages.findIndex((message) => message.id === item.replyToMessageId) : -1;
              const messageToBeReplied = (indexOfMessageToBeReplied !== -1)
                ? storage.messages[indexOfMessageToBeReplied]
                : null;
              return (
                <span
                  key={item.id}
                  id={item.id}
                  className='user-message-wrapper'
                  ref={node => setRef(node, index)}>
                  <UserMessage
                    edited={!!item.lastEditedTimestamp}
                    reactions={item.reactions}
                    active={active}
                    emphasized={item.emphasized}
                    initials={item.initials}
                    moderator={item.moderator}
                    name={item.name}
                    messageToBeReplied={messageToBeReplied}
                    scrollTo={scrollTo}
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
                    question={item.question}
                    responders={item.responders}
                    timestamp={timestamp}
                    type={item.type}
                    isQuiz={item.isQuiz}
                    showCorrectAnswer={item.showCorrectAnswer}
                  />
                </span>
              );
            case ID.VIDEOS:

              return (
                <span ref={node => setRef(node, index)}>
                  <VideoMessage
                    active={active}
                    url={item.url}
                    timestamp={timestamp}
                    type={item.type}
                  />
                </span>
              );
            default:
              return <span ref={node => setRef(node, index)} />;
          }
        })}
      </div>
    </div>
  );
};

Messages.propTypes = propTypes;
Messages.defaultProps = defaultProps;

export default Messages;
