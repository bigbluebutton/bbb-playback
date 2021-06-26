import React from 'react';
import PropTypes from 'prop-types';
import Linkify from 'linkifyjs/react';
import cx from 'classnames';

const propTypes = {
  active: PropTypes.bool,
  hyperlink: PropTypes.bool,
  text: PropTypes.string,
};

const defaultProps = {
  active: false,
  hyperlink: false,
  text: '',
};

const Text = ({
  active,
  hyperlink,
  text,
}) => {
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

Text.propTypes = propTypes;
Text.defaultProps = defaultProps;

export default Text;
