import React from 'react';
import cx from 'classnames';
import './index.scss';

const Item = ({ icon, value }) => {
  let element;
  if (typeof value === 'boolean') {
    const icon = value ? 'icon-check' : 'icon-close';

    const style = {
      green: value,
      red: !value,
    };

    element = <div className={cx(icon, style)} />;
  } else {
    element = value;
  }

  return (
    <div className="item">
      <div className={`icon-${icon}`} />
      <div className="value">
        {element}
      </div>
    </div>
  );
};

export default Item;
