import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Thumbnail from './thumbnail';
import { handleOnKeyActivation } from 'utils/data/handlers';
import player from 'utils/player';
import './index.scss';

const propTypes = {
  active: PropTypes.bool,
  index: PropTypes.number,
  interactive: PropTypes.bool,
  item: PropTypes.object,
  setRef: PropTypes.func,
};

const defaultProps = {
  active: false,
  index: 0,
  interactive: false,
  item: {},
  setRef: () => {},
};

const Item = ({
  active,
  index,
  interactive,
  item,
  setRef,
}) => {
  if (!interactive) {

    return (
      <div
        className="thumbnail-wrapper"
        tabIndex="0"
      >
        <Thumbnail
          alt={item.alt}
          height={item.height}
          index={index}
          src={item.src}
          width={item.width}
        />
      </div>
    );
  }

  const handleOnClick = () => {
    if (interactive) player.primary.currentTime(item.timestamp);
  };

  return (
    <div
      className={cx('thumbnail-wrapper', { active, interactive })}
      onClick={() => handleOnClick()}
      onKeyDown={event => handleOnKeyActivation(event, handleOnClick)}
      ref={node => setRef(node, index)}
      role="button"
      tabIndex="0"
    >
      <Thumbnail
        alt={item.alt}
        height={item.height}
        index={index}
        src={item.src}
        width={item.width}
      />
    </div>
  );
};

Item.propTypes = propTypes;
Item.defaultProps = defaultProps;

export default Item;
