import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import { controls as config } from 'config';
import { ID } from 'utils/constants';
import layout from 'utils/layout';

const intlMessages = defineMessages({
  swap: {
    id: 'button.swap.aria',
    description: 'Aria label for the swap button',
  },
});

const propTypes = { toggleSwap: PropTypes.func };

const defaultProps = { toggleSwap: () => {} };

const Swap = ({ toggleSwap }) => {
  const intl = useIntl();

  if (!layout.control || !config.swap || layout.single) return null;

  return (
    <Button
      aria={intl.formatMessage(intlMessages.swap)}
      circle
      handleOnClick={toggleSwap}
      icon={ID.SWAP}
    />
  );
};

Swap.propTypes = propTypes;
Swap.defaultProps = defaultProps;

export default Swap;
