import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'utils/data/validators';
import './index.scss';

const propTypes = { text: PropTypes.string };

const defaultProps = { text: '' };

const Text = ({ text }) => {
  if (isEmpty(text)) return null;

  return (
    <div className="question-text">
      {text}
    </div>
  );
};

Text.propTypes = propTypes;
Text.defaultProps = defaultProps;

export default Text;
