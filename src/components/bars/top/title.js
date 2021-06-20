import React from 'react';
import {
  defineMessages,
  FormattedDate,
} from 'react-intl';
import cx from 'classnames';
import './index.scss';

const intlMessages = defineMessages({
  about: {
    id: 'button.about.aria',
    description: 'Aria label for the about button',
  },
});

const Title = ({ interactive, intl, name, start, toggleAbout }) => {
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
      onKeyPress={(e) => e.key === 'Enter' ? toggleAbout() : null}
      tabIndex="0"
    >
      {name} - {date}
    </span>
  );
};

export default Title;
