import React from 'react';
import cx from 'classnames';
import Avatar from 'components/utils/avatar';
import { handleOnEnterPress } from 'utils/data';
import './index.scss';

const Margin = (props) => {

  return (
    <div
      className={cx('interactive', { inactive: !props.active })}
      onClick={props.onClick}
      onKeyPress={event => handleOnEnterPress(event, props.onClick)}
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
