import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'utils/data/validators';
import Linkify from 'linkify-react';
import cx from 'classnames';

const propTypes = {
  active: PropTypes.bool,
  url: PropTypes.string,
};

const defaultProps = {
  active: false,
  url: '',
};

const Url = ({
  active,
  url,
}) => {
  if (isEmpty(url)) return null;

  const options = {
    className: cx('linkified', { inactive: !active }),
    target: '_blank',
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
