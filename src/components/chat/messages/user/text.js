import React from 'react';
import PropTypes from 'prop-types';

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
  return (
    <div
      className='text-vanilla'
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
};

Text.propTypes = propTypes;
Text.defaultProps = defaultProps;

export default Text;
