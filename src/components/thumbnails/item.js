import React from 'react';
import cx from 'classnames';
import Thumbnail from './thumbnail';
import { handleOnEnterPress } from 'utils/data';
import './index.scss';

const Item = ({ active, index, interactive, item, player, recordId, setRef }) => {
  if (!interactive) {

    return (
      <div
        className="thumbnail-wrapper"
        tabIndex="0"
      >
        <Thumbnail
          alt={item.alt}
          index={index}
          recordId={recordId}
          src={item.src}
        />
      </div>
    );
  }

  const handleOnClick = () => {
    if (player) player.currentTime(item.timestamp);
  };

  return (
    <div
      className={cx('thumbnail-wrapper', { active, interactive })}
      onClick={() => handleOnClick()}
      onKeyPress={event => handleOnEnterPress(event, handleOnClick)}
      ref={node => setRef(node, index)}
      tabIndex="0"
    >
      <Thumbnail
        alt={item.alt}
        index={index}
        recordId={recordId}
        src={item.src}
      />
    </div>
  );
};

export default Item;
