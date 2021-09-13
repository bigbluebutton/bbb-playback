import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { chat as config } from 'config';
import Messages from './messages';
import {
  ID,
  POSITIONS,
} from 'utils/constants';
import { handleAutoScroll } from 'utils/data/handlers';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.chat.wrapper.aria',
    description: 'Aria label for the chat wrapper',
  },
});

const propTypes = { currentDataIndex: PropTypes.number };

const defaultProps = { currentDataIndex: 0 };

const Chat = ({ currentDataIndex }) => {
  const interaction = useRef(false);
  const firstNode = useRef();
  const currentNode = useRef();

  const intl = useIntl();

  const setRef = (node, index) => {
    if (index === 0) {
      firstNode.current = node;
    }

    if (index === currentDataIndex) {
      currentNode.current = node;
    }
  };

  useEffect(() => {
    if (!interaction.current) {
      if (config.scroll) {
        handleAutoScroll(firstNode.current, currentNode.current, POSITIONS.TOP, config.align);
      }
    }
  });

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      aria-live="polite"
      className="chat-wrapper"
      id={ID.CHAT}
      onMouseEnter={() => interaction.current = true}
      onMouseLeave={() => interaction.current = false}
      tabIndex="0"
    >
      <Messages
        currentDataIndex={currentDataIndex}
        setRef={(node, index) => setRef(node, index)}
      />
    </div>
  );
};

Chat.propTypes = propTypes;
Chat.defaultProps = defaultProps;

const areEqual = (prevProps, nextProps) => {
  if (prevProps.currentDataIndex !== nextProps.currentDataIndex) return false;

  return true;
};

export default React.memo(Chat, areEqual);
