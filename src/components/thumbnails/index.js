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
  player: PropTypes.object,
  recordId: PropTypes.string,
  search: PropTypes.array,
  thumbnails: PropTypes.array,
};

const defaultProps = {
  currentDataIndex: 0,
  handleSearch: () => {},
  interactive: false,
  player: {},
  recordId: '',
  search: [],
  thumbnails: [],
};

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
      {thumbnails.reduce((result, item, index) => {
        if (!isFiltered(index)) {
          const active = index === currentDataIndex;

          result.push(
            <Item
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

Thumbnails.propTypes = propTypes;
Thumbnails.defaultProps = defaultProps;

const areEqual = (prevProps, nextProps) => {
  if (prevProps.currentDataIndex !== nextProps.currentDataIndex) return false;

  if (!isEqual(prevProps.search, nextProps.search)) return false;

  if (!prevProps.player && nextProps.player) return false;

  return true;
};

export default React.memo(Thumbnails, areEqual);
