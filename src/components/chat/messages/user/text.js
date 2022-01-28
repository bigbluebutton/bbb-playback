import React from 'react';
import PropTypes from 'prop-types';
import Linkify from 'linkifyjs/react';
import cx from 'classnames';
import './index.scss';

const propTypes = {
  active: PropTypes.bool,
  emphasize: PropTypes.bool,
  hyperlink: PropTypes.bool,
  text: PropTypes.string,
};

const defaultProps = {
  active: false,
  emphasize: false,
  hyperlink: false,
  text: '',
};

const Text = ({
  active,
  emphasize,
  hyperlink,
  text,
}) => {
  if (hyperlink) {
    const options = {
      className: cx('linkified', { inactive: !active, emphasize }),
    };

    return (
      <Linkify options={options}>
        {text}
      </Linkify>
    );
  }

  return (
    <div className={cx({ emphasize })}>
      {text}
    </div>
  );
};

Text.propTypes = propTypes;
Text.defaultProps = defaultProps;

export default Text;
