import React from 'react';
import cx from 'classnames';
import Info from './info';
import Margin from './margin';
import './index.scss';

const Message = (props) => {
  const {
    active,
    name,
  } = props;

  return (
    <div className="message">
      <Margin
        active={active}
        icon={props.icon}
        initials={props.initials}
        name={name}
        onClick={props.onClick}
      />
      <div className="data">
        <Info
          active={active}
          name={name}
          timestamp={props.timestamp}
        />
        <div className={cx('text', { inactive: !active })}>
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default Message;
