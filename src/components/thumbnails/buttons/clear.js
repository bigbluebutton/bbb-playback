import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import { isEmpty } from 'utils/data/validators';
import './index.scss';

const intlMessages = defineMessages({
  clear: {
    id: 'button.clear.aria',
    description: 'Aria label for the clear button',
  },
});

const propTypes = {
  interactive: PropTypes.bool,
  onClick: PropTypes.func,
  search: PropTypes.array,
};

const defaultProps = {
  interactive: false,
  onClick: () => {},
  search: [],
};

const Clear = ({
  interactive,
  onClick,
  search,
}) => {
  const intl = useIntl();

  if (!interactive) return null;

  if (isEmpty(search)) return null;

  return (
    <div className="clear-button">
      <Button
        aria={intl.formatMessage(intlMessages.clear)}
        handleOnClick={onClick}
        icon="close"
        type="solid"
      />
    </div>
  );
};

Clear.propTypes = propTypes;
Clear.defaultProps = defaultProps;

export default Clear;
