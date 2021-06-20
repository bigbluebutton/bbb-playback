import React from 'react';
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

const Swap = ({ enabled, toggleSwap }) => {
  const intl = useIntl();

  if (!enabled) return null;

  return (
    <Button
      aria={intl.formatMessage(intlMessages.swap)}
      circle
      handleOnClick={toggleSwap}
      icon={ID.SWAP}
    />
  );
};

export default Swap;
