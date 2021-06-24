import React from 'react';
import cx from 'classnames';
import Avatar from 'components/utils/avatar';
import './index.scss';

const Margin = (props) => {
  const handleOnKeyPress = (event) => {
    if (event.key === 'Enter') props.onClick();
  };

  return (
    <div
      className={cx('interactive', { inactive: !props.active })}
      onClick={props.onClick}
      onKeyPress={event => handleOnKeyPress(event)}
      tabIndex="0"
    >
      <Avatar
        active={props.active}
        icon={props.icon}
        initials={props.initials}
        name={props.name}
      />
    </div>
  );
};

export default Margin;
