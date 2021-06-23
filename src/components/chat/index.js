import React, { useEffect, useRef } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { chat as config } from 'config';
import Messages from './messages';
import {
  ID,
  getScrollTop,
} from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.chat.wrapper.aria',
    description: 'Aria label for the chat wrapper',
  },
});

const Chat = ({ chat, currentDataIndex, player }) => {
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

  const handleAutoScroll = (align) => {
    if (interaction.current) return;

    const { current: fNode } = firstNode;
    const { current: cNode } = currentNode;

    // Auto-scroll can start after getting the first and current nodes
    if (fNode && cNode) {
      const { align } = config;
      const { parentNode: pNode } = cNode;

      pNode.scrollTop = getScrollTop(fNode, cNode, align);
    }
  };

  useEffect(() => {
    if (!config.scroll) return () => {};

    handleAutoScroll();

    return () => handleAutoScroll();
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
        chat={chat}
        currentDataIndex={currentDataIndex}
        player={player}
        setRef={(node, index) => setRef(node, index)}
      />
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  return prevProps.currentDataIndex === nextProps.currentDataIndex;
};

export default React.memo(Chat, areEqual);
