import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'utils/data/validators';
import Linkify from 'linkifyjs/react';
import cx from 'classnames';
import './index.scss';

const propTypes = { url: PropTypes.string };

const defaultProps = { url: '' };

const Url = ({ 
  url, 
  active 
}) => {
  if (isEmpty(url)) return null;

  const options = {
    className: cx('linkified', { inactive: !active }),
  };

  return (
    <Linkify options={options}>
      {url}
    </Linkify>
  );
};

Url.propTypes = propTypes;
Url.defaultProps = defaultProps;

export default Url;