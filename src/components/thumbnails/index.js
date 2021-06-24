import React, { useEffect, useRef } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Thumbnail from './thumbnail';
import ClearButton from './buttons/clear';
import { thumbnails as config } from 'config';
import {
  ID,
  getScrollLeft,
  isEmpty,
  isEqual,
} from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.thumbnails.wrapper.aria',
    description: 'Aria label for the thumbnails wrapper',
  },
});

const Thumbnails = ({
  currentDataIndex,
  handleSearch,
  interactive,
  player,
  recordId,
  search,
  thumbnails,
}) => {
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

  const handleAutoScroll = () => {
    if (interaction.current) return;

    const { current: fNode } = firstNode;
    const { current: cNode } = currentNode;

    // Auto-scroll can start after getting the first and current nodes
    if (fNode && cNode) {
      const { align } = config;
      const { parentNode: pNode } = cNode;

      pNode.scrollLeft = getScrollLeft(fNode, cNode, align);
    }
  };

  const isFiltered = (index) => {
    if (interactive) {
      return !isEmpty(search) && !search.includes(index);
    } else {
      return !search.includes(index);
    }
  }

  useEffect(() => config.scroll ? handleAutoScroll() : null);

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="thumbnails-wrapper"
      id={ID.THUMBNAILS}
      onMouseEnter={() => interaction.current = true}
      onMouseLeave={() => interaction.current = false}
      tabIndex="0"
    >
      {thumbnails.reduce((result, item, index) => {
        if (!isFiltered(index)) {
          const active = index === currentDataIndex;

          result.push(
            <Thumbnail
              active={active}
              index={index}
              interactive={interactive}
              item={item}
              player={player}
              recordId={recordId}
              setRef={setRef}
            />
          );
        }

        return result;
      }, [])}
      <ClearButton
        interactive={interactive}
        handleSearch={handleSearch}
        search={search}
      />
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.currentDataIndex !== nextProps.currentDataIndex) return false;

  if (!isEqual(prevProps.search, nextProps.search, 'array')) return false;

  if (!prevProps.player && nextProps.player) return false;

  return true;
};

export default React.memo(Thumbnails, areEqual);
