import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
  FormattedDate,
} from 'react-intl';
import cx from 'classnames';
import { handleOnEnterPress } from 'utils/data/handlers';
import storage from 'utils/data/storage';
import './index.scss';

const intlMessages = defineMessages({
  about: {
    id: 'button.about.aria',
    description: 'Aria label for the about button',
  },
});

const propTypes = {
  interactive: PropTypes.bool,
  toggleAbout: PropTypes.func,
};

const defaultProps = {
  interactive: false,
  toggleAbout: () => {},
};

const Title = ({
  interactive,
  toggleAbout,
}) => {
  const intl = useIntl();
  const date = <FormattedDate value={new Date(storage.metadata.start)} />;

  if (!interactive) {

    return (
      <span className="title">
        {storage.metadata.name} - {date}
      </span>
    );
  }

  return (
    <span
      aria={intl.formatMessage(intlMessages.about)}
      className={cx('title', { interactive })}
      onClick={toggleAbout}
      onKeyPress={event => handleOnEnterPress(event, toggleAbout)}
      tabIndex="0"
    >
      {storage.metadata.name} - {date}
    </span>
  );
};

Title.propTypes = propTypes;
Title.defaultProps = defaultProps;

export default Title;
