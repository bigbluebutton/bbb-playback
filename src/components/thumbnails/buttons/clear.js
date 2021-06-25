import React from 'react';
import PropTypes from 'prop-types';
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

const propTypes = {
  interactive: PropTypes.bool,
  handleSearch: PropTypes.func,
  search: PropTypes.array,
};

const defaultProps = {
  interactive: false,
  handleSearch: () => {},
  search: [],
};

const Clear = (props) => {
  const intl = useIntl();

  if (!props.interactive) return null;

  if (isEmpty(props.search)) return null;

  return (
    <div className="clear-button">
      <Button
        aria={intl.formatMessage(intlMessages.clear)}
        handleOnClick={() => props.handleSearch([])}
        icon="close"
        type="solid"
      />
    </div>
  );
};

Clear.propTypes = propTypes;
Clear.defaultProps = defaultProps;

export default Clear;
