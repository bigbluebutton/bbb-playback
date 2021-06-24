import React from 'react';
import cx from 'classnames';
import Content from './content';
import { handleOnEnterPress } from 'utils/data';
import './index.scss';

const Thumbnail = ({ active, index, interactive, item, player, recordId, setRef }) => {
  // Thumbnail at search result is set as a not interactive element
  if (!interactive) {

    return (
      <div
        className="thumbnail-wrapper"
        tabIndex="0"
      >
        <Content
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
      <Content
        alt={item.alt}
        index={index}
        recordId={recordId}
        src={item.src}
      />
    </div>
  );
};

export default Thumbnail;
