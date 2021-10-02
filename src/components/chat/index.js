import React, { useEffect, useRef } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { chat as config } from 'config';
import Messages from './messages';
import { useCurrentIndex } from 'components/utils/hooks';
import {
  ID,
  POSITIONS,
} from 'utils/constants';
import { handleAutoScroll } from 'utils/data/handlers';
import storage from 'utils/data/storage';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.chat.wrapper.aria',
    description: 'Aria label for the chat wrapper',
  },
});

const Chat = () => {
  const intl = useIntl();
  const currentIndex = useCurrentIndex(storage.messages);
  const interaction = useRef(false);
  const firstNode = useRef();
  const currentNode = useRef();

  const setRef = (node, index) => {
    if (index === 0) {
      firstNode.current = node;
    }

    if (index === currentIndex) {
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
        currentIndex={currentIndex}
        setRef={(node, index) => setRef(node, index)}
      />
    </div>
  );
};

const areEqual = () => true;

export default React.memo(Chat, areEqual);
