import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import { isEmpty } from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  clear: {
    id: 'button.clear.aria',
    description: 'Aria label for the clear button',
  },
});

const Clear = ({ interactive, handleSearch, search }) => {
  const intl = useIntl();

  if (!interactive) return null;

  if (isEmpty(search)) return null;

  return (
    <div className="clear-button">
      <Button
        aria={intl.formatMessage(intlMessages.clear)}
        handleOnClick={() => handleSearch ? handleSearch([]) : null}
        icon="close"
        type="solid"
      />
    </div>
  );
};

export default Clear;
