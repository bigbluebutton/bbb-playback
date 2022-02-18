import React from 'react';
import PropTypes from 'prop-types';
import './index.scss';

const propTypes = { code: PropTypes.string };

const defaultProps = { code: '' };

const Key = ({ code }) => {

  return (
    <div className="key">
      {code}
    </div>
  );
};

Key.propTypes = propTypes;
Key.defaultProps = defaultProps;

export default Key;
