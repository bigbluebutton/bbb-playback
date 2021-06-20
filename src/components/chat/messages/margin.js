import React from 'react';
import cx from 'classnames';
import Avatar from 'components/utils/avatar';
import './index.scss';

const Margin = ({ active, icon, initials, name, onClick }) => {

  return (
    <div
      className={cx('interactive', { inactive: !active })}
      onClick={onClick}
      onKeyPress={(e) => e.key === 'Enter' ? onClick() : null}
      tabIndex="0"
    >
      <Avatar
        active={active}
        icon={icon}
        initials={initials}
        name={name}
      />
    </div>
  );
};

export default Margin;
