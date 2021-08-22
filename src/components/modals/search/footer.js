import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import './index.scss';

const intlMessages = defineMessages({
  search: {
    id: 'button.search.aria',
    description: 'Aria label for the search button',
  },
});

const propTypes = {
  disabled: PropTypes.bool,
  handleOnClick: PropTypes.func,
};

const defaultProps = {
  disabled: false,
  handleOnClick: () => {},
};

const Footer = ({
  disabled,
  handleOnClick,
}) => {
  const intl = useIntl();

  return (
    <div className="search-footer">
      <Button
        aria={intl.formatMessage(intlMessages.search)}
        disabled={disabled}
        handleOnClick={(event) => handleOnClick(event)}
        icon="search"
        type="solid"
      />
    </div>
  );
};

Footer.propTypes = propTypes;
Footer.defaultProps = defaultProps;

export default Footer;
