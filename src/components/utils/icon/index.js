import React from 'react';
import PropTypes from 'prop-types';
import './index.scss';

const propTypes = { name: PropTypes.string };

const defaultProps = { name: '' };

const Icon = ({ name }) => {

  return <span className={`icon-${name}`} />;
};

Icon.propTypes = propTypes;
Icon.defaultProps = defaultProps;

export default Icon;
