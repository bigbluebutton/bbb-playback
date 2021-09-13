import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Item from './item';
import ClearButton from './buttons/clear';
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
  currentDataIndex: PropTypes.number,
  handleSearch: PropTypes.func,
  interactive: PropTypes.bool,
  search: PropTypes.array,
};

const defaultProps = {
  currentDataIndex: 0,
  handleSearch: () => {},
  interactive: false,
  search: [],
};

const Thumbnails = ({
  currentDataIndex,
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

    if (index === currentDataIndex) {
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

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="thumbnails-wrapper"
      id={ID.THUMBNAILS}
      onMouseEnter={() => interaction.current = true}
      onMouseLeave={() => interaction.current = false}
      tabIndex="0"
    >
      {storage.thumbnails.reduce((result, item, index) => {
        if (!isFiltered(index)) {
          const active = index === currentDataIndex;

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
  if (prevProps.currentDataIndex !== nextProps.currentDataIndex) return false;

  if (!isEqual(prevProps.search, nextProps.search)) return false;

  return true;
};

export default React.memo(Thumbnails, areEqual);
