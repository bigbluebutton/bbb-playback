import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import { ID } from 'utils/data';

const intlMessages = defineMessages({
  swap: {
    id: 'button.swap.aria',
    description: 'Aria label for the swap button',
  },
});

const propTypes = {
  enabled: PropTypes.bool,
  toggleSwap: PropTypes.func,
};

const defaultProps = {
  enabled: false,
  toggleSwap: () => {},
};

const Swap = (props) => {
  const intl = useIntl();

  if (!props.enabled) return null;

  return (
    <Button
      aria={intl.formatMessage(intlMessages.swap)}
      circle
      handleOnClick={props.toggleSwap}
      icon={ID.SWAP}
    />
  );
};

Swap.propTypes = propTypes;
Swap.defaultProps = defaultProps;

export default Swap;
