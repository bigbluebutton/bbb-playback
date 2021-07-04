import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
  FormattedDate,
} from 'react-intl';
import cx from 'classnames';
import { handleOnEnterPress } from 'utils/data/handlers';
import './index.scss';

const intlMessages = defineMessages({
  about: {
    id: 'button.about.aria',
    description: 'Aria label for the about button',
  },
});

const propTypes = {
  interactive: PropTypes.bool,
  name: PropTypes.string,
  start: PropTypes.number,
  toggleAbout: PropTypes.func,
};

const defaultProps = {
  interactive: false,
  name: '',
  start: 0,
  toggleAbout: () => {},
};

const Title = ({
  interactive,
  name,
  start,
  toggleAbout,
}) => {
  const intl = useIntl();
  const date = <FormattedDate value={new Date(start)} />;

  if (!interactive) {

    return (
      <span className="title">
        {name} - {date}
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
      {name} - {date}
    </span>
  );
};

Title.propTypes = propTypes;
Title.defaultProps = defaultProps;

export default Title;
