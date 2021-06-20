import React from 'react';
import Linkify from 'linkifyjs/react';
import cx from 'classnames';

const Text = ({ active, hyperlink, text }) => {
  if (hyperlink) {
    const options = {
      className: cx('linkified', { inactive: !active }),
    };

    return (
      <Linkify options={options}>
        {text}
      </Linkify>
    );
  }

  return (
    <React.Fragment>
      {text}
    </React.Fragment>
  );
};

export default Text;
