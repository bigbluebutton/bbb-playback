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

const decodeEntities = (text) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

const Text = ({
  active,
  text,
}) => {
  return (
    <div
      className='text-vanilla'
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(decodeEntities(text)) }}
    />
  );
};

Text.propTypes = propTypes;
Text.defaultProps = defaultProps;

export default Text;
