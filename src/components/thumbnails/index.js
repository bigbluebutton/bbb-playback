import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Item from './item';
import ClearButton from './buttons/clear';
import { useCurrentIndex } from 'components/utils/hooks';
import { thumbnails as config } from 'config';
import {
  ID,
  POSITIONS,
} from 'utils/constants';
import { handleAutoScroll } from 'utils/data/handlers';
import storage from 'utils/data/storage';
import {
  isEmpty,
  isEqual,
} from 'utils/data/validators';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.thumbnails.wrapper.aria',
    description: 'Aria label for the thumbnails wrapper',
  },
});

const propTypes = {
  handleSearch: PropTypes.func,
  interactive: PropTypes.bool,
  search: PropTypes.array,
};

const defaultProps = {
  handleSearch: () => { },
  interactive: false,
  search: [],
};

const Thumbnails = ({
  handleSearch,
  interactive,
  search,
}) => {
  const interaction = useRef(false);
  const firstNode = useRef();
  const currentNode = useRef();

  const intl = useIntl();

  const setRef = (node, index) => {
    if (index === 0) {
      firstNode.current = node;
    }

    if (index === currentIndex) {
      currentNode.current = node;
    }
  };

  const isFiltered = (index) => {
    if (interactive) {
      return !isEmpty(search) && !search.includes(index);
    } else {
      return !search.includes(index);
    }
  }

  useEffect(() => {
    if (!interaction.current) {
      if (config.scroll) {
        handleAutoScroll(firstNode.current, currentNode.current, POSITIONS.LEFT, config.align);
      }
    }
  });

  const items = useMemo(() => {
    const thumbnails = storage.thumbnails;
    const layoutSwap = (storage.layoutSwap ?? []).filter(item => item.hasOwnProperty('showScreenshare'));
    const merged = [...thumbnails, ...layoutSwap];
    const sorted = merged.sort((a, b) => a.timestamp - b.timestamp);

    const addThumbsForSwap = sorted.map((item, index, arr) => {
      // If the item is a standard thumbnail (not a layout event), preserve it.
      if (!item.hasOwnProperty('showScreenshare')) {
        return item;
      }

      const previousItem = arr[index - 1];
      const nextItem = arr[index + 1];

      // Handle logic when screenshare is inactive (restore presentation)
      if (!item.showScreenshare) {
        // Prevent duplicate consecutive 'restore' actions
        if (
          previousItem?.hasOwnProperty('showScreenshare')
          && !previousItem.showScreenshare
        ) {
          return null;
        }

        const previousThumbs = arr.slice(0, index);
        const restoredSlide = previousThumbs.find((t) => t.src && t.src !== 'screenshare');

        // Only add if the restored slide is different from the immediate previous item
        if (restoredSlide?.src && restoredSlide?.src !== previousItem?.src) {
          return {
            ...item,
            src: restoredSlide.src,
            alt: restoredSlide.alt ?? '',
          };
        }
        return null;
      }

      // Handle logic when screenshare is active
      if (item.showScreenshare) {
        // Prevent duplicate consecutive 'screenshare' actions
        if (
          previousItem?.hasOwnProperty('showScreenshare')
          && previousItem.showScreenshare
        ) {
          return null;
        }

        // Ensure strictly valid boundaries (must have valid next/prev items)
        const hasValidNeighbors =
          (nextItem && nextItem.src !== 'screenshare') &&
          (previousItem && previousItem.src !== 'screenshare');

        if (hasValidNeighbors) {
          return {
            ...item,
            src: 'screenshare',
            alt: 'screenshare',
          };
        }
      }

      return null;
    }).filter((item) => item !== null);

    // Re-index all items sequentially
    return addThumbsForSwap.map((item, index) => ({
      ...item,
      id: index + 1,
    }));
  }, []);

  const currentIndex = useCurrentIndex(items);

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="thumbnails-wrapper"
      id={ID.THUMBNAILS}
      onMouseEnter={() => interaction.current = true}
      onMouseLeave={() => interaction.current = false}
      tabIndex="0"
    >
      {items.reduce((result, item, index) => {
        if (!isFiltered(index)) {
          const active = index === currentIndex;

          result.push(
            <Item
              active={active}
              index={index}
              interactive={interactive}
              item={item}
              setRef={setRef}
            />
          );
        }

        return result;
      }, [])}
      <ClearButton
        interactive={interactive}
        onClick={() => handleSearch([])}
        search={search}
      />
    </div>
  );
};

Thumbnails.propTypes = propTypes;
Thumbnails.defaultProps = defaultProps;

const areEqual = (prevProps, nextProps) => {
  if (!isEqual(prevProps.search, nextProps.search)) return false;

  return true;
};

export default React.memo(Thumbnails, areEqual);
