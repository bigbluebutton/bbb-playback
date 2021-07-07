import React from 'react';
import PropTypes from 'prop-types';
import UserMessage from './user';
import PollMessage from './system/poll';
import QuestionMessage from './system/question';
import ExternalVideoMessage from './system/external-video';
import { ID } from 'utils/constants';
import { getMessageType } from 'utils/data';
import './index.scss';

const propTypes = {
  chat: PropTypes.array,
  currentDataIndex: PropTypes.number,
  player: PropTypes.object,
  setRef: PropTypes.func,
};

const defaultProps = {
  chat: [],
  currentDataIndex: 0,
  player: {},
  setRef: () => {},
};

const Messages = ({
  chat,
  currentDataIndex,
  player,
  setRef,
}) => {

  return (
    <div className="list">
      <div className="message-wrapper">
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
                    player={player}
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
                    player={player}
                    question={item.question}
                    responders={item.responders}
                    timestamp={timestamp}
                    type={item.type}
                  />
                </span>
              );
            case ID.QUESTIONS:

              return (
                <span ref={node => setRef(node, index)}>
                  <QuestionMessage
                    active={active}
                    answer={item.answer}
                    player={player}
                    text={item.text}
                    timestamp={timestamp}
                  />
                </span>
              );
            case ID.EXTERNAL_VIDEOS:

              return (
                <span ref={node => setRef(node, index)}>
                  <ExternalVideoMessage
                    active={active}
                    player={player}
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
