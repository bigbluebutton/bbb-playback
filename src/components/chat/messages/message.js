import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Info from './info';
import Margin from './margin';
import player from 'utils/player';
import './index.scss';
import Reply from './reply';
import ChatMessageReactions from './reactions';

const propTypes = {
  active: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  circle: PropTypes.bool,
  emphasized: PropTypes.bool,
  icon: PropTypes.string,
  initials: PropTypes.string,
  name: PropTypes.string,
  timestamp: PropTypes.number,
};

const defaultProps = {
  active: false,
  children: null,
  circle: false,
  emphasized: false,
  icon: '',
  initials: '',
  name: '',
  timestamp: 0,
  reactions: [],
};

const Message = ({
  active,
  children,
  circle,
  emphasized,
  icon,
  initials,
  messageToBeReplied,
  scrollTo,
  edited,
  name,
  reactions,
  timestamp,
}) => {
  const handleOnClick = () => {
    if (player.primary) player.primary.currentTime(timestamp);
  };

  return (
    <div className="message">
      <div
        className="main-content-wrapper"
      >
        <Margin
          active={active}
          circle={circle}
          icon={icon}
          initials={initials}
          name={name}
          onClick={() => handleOnClick()}
        />
        <div className="data">
          <Info
            edited={edited}
            active={active}
            name={name}
            timestamp={timestamp}
          />
          {messageToBeReplied &&
            <Reply
              active={active}
              scrollTo={scrollTo}
              idToReference={messageToBeReplied.id}
              text={messageToBeReplied.message}
            />
          }
          <div className={cx('text', { inactive: !active, emphasized })}>
            {children}
          </div>
        </div>
      </div>
      <ChatMessageReactions
        reactions={reactions}
        active={active}
      />
    </div>
  );
};

Message.propTypes = propTypes;
Message.defaultProps = defaultProps;

export default Message;
