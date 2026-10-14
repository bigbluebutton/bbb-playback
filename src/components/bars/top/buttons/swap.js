import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { controls as config } from 'config';
import { ID } from 'utils/constants';
import layout from 'utils/layout';

const intlMessages = defineMessages({
  swap: {
    id: 'button.swap.aria',
    description: 'Aria label for the swap button',
  },
});

// "Swap content", for the top bar's More menu
const useSwapItem = ({ toggleSwap, hidePresentation }) => {
  const intl = useIntl();

  if (!layout.control || !config.swap || layout.single || hidePresentation) return null;

  return {
    icon: ID.SWAP,
    key: 'swap',
    label: intl.formatMessage(intlMessages.swap),
    onSelect: toggleSwap,
  };
};

export default useSwapItem;
