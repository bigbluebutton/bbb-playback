import React from 'react';
import cx from 'classnames';
import Info from './info';
import Margin from './margin';
import './index.scss';

const Message = (props) => {
  const handleOnClick = (timestamp) => {
    if (props.player) props.player.currentTime(timestamp);
  };

  return (
    <div className="message">
      <Margin
        active={props.active}
        icon={props.icon}
        initials={props.initials}
        name={props.name}
        onClick={() => handleOnClick(props.timestamp)}
      />
      <div className="data">
        <Info
          active={props.active}
          name={props.name}
          timestamp={props.timestamp}
        />
        <div className={cx('text', { inactive: !props.active })}>
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default Message;
