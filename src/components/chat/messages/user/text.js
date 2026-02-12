import React from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';

const propTypes = {
  active: PropTypes.bool,
  text: PropTypes.string,
};

const defaultProps = {
  active: false,
  text: '',
};

const Text = ({
  active,
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
