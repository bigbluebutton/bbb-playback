import React from 'react';
import {
  defineMessages,
  useIntl,
  FormattedDate,
} from 'react-intl';
import cx from 'classnames';
import { handleOnEnterPress } from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  about: {
    id: 'button.about.aria',
    description: 'Aria label for the about button',
  },
});

const Title = ({ interactive, name, start, toggleAbout }) => {
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

export default Title;
