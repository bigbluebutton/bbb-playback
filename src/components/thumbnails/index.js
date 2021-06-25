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
  handleAutoScroll,
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

const Thumbnails = (props) => {
  const interaction = useRef(false);
  const firstNode = useRef();
  const currentNode = useRef();

  const intl = useIntl();

  const setRef = (node, index) => {
    if (index === 0) {
      firstNode.current = node;
    }

    if (index === props.currentDataIndex) {
      currentNode.current = node;
    }
  };

  const isFiltered = (index) => {
    if (props.interactive) {
      return !isEmpty(props.search) && !props.search.includes(index);
    } else {
      return !props.search.includes(index);
    }
  }

  useEffect(() => {
    if (!interaction.current) {
      if (config.scroll) {
        handleAutoScroll(firstNode.current, currentNode.current, ID.LEFT, config.align);
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
      {props.thumbnails.reduce((result, item, index) => {
        if (!isFiltered(index)) {
          const active = index === props.currentDataIndex;

          result.push(
            <Item
              active={active}
              index={index}
              interactive={props.interactive}
              item={item}
              player={props.player}
              recordId={props.recordId}
              setRef={setRef}
            />
          );
        }

        return result;
      }, [])}
      <ClearButton
        interactive={props.interactive}
        handleSearch={props.handleSearch}
        search={props.search}
      />
    </div>
  );
};

Thumbnails.propTypes = propTypes;
Thumbnails.defaultProps = defaultProps;

const areEqual = (prevProps, nextProps) => {
  if (prevProps.currentDataIndex !== nextProps.currentDataIndex) return false;

  if (!isEqual(prevProps.search, nextProps.search, 'array')) return false;

  if (!prevProps.player && nextProps.player) return false;

  return true;
};

export default React.memo(Thumbnails, areEqual);
