import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';

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
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
    />
  );
};

Text.propTypes = propTypes;
Text.defaultProps = defaultProps;

export default Text;
