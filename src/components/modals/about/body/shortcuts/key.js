import React from 'react';
import PropTypes from 'prop-types';
import './index.scss';

const propTypes = { code: PropTypes.string };

const defaultProps = { code: '' };

// Arrow keys read better as arrows
const SYMBOLS = {
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
};

const Key = ({ code }) => {
  const symbol = SYMBOLS[code];

  return (
    <kbd className="key" title={symbol ? code : undefined}>
      {symbol || code}
    </kbd>
  );
};

Key.propTypes = propTypes;
Key.defaultProps = defaultProps;

export default Key;
