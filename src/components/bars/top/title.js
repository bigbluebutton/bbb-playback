import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
  FormattedDate,
} from 'react-intl';
import cx from 'classnames';
import {
  controls as config,
  date,
} from 'config';
import { handleOnEnterPress } from 'utils/data/handlers';
import storage from 'utils/data/storage';
import layout from 'utils/layout';
import './index.scss';

const intlMessages = defineMessages({
  about: {
    id: 'button.about.aria',
    description: 'Aria label for the about button',
  },
});

const propTypes = { openAbout: PropTypes.func };

const defaultProps = { openAbout: () => {} };

const Title = ({ openAbout }) => {
  const intl = useIntl();
  const start = <FormattedDate value={new Date(storage.metadata.start)} />;

  const interactive = layout.control && config.about;
  if (!interactive) {

    return (
      <span className="title">
        {storage.metadata.name}
        {date.enabled ? (
          <> - {start}</>
        ) : null}
      </span>
    );
  }

  return (
    <span
      aria={intl.formatMessage(intlMessages.about)}
      className={cx('title', { interactive })}
      onClick={openAbout}
      onKeyPress={event => handleOnEnterPress(event, openAbout)}
      tabIndex="0"
    >
      {storage.metadata.name}
      {date.enabled ? (
        <> - {start}</>
      ) : null}
    </span>
  );
};

Title.propTypes = propTypes;
Title.defaultProps = defaultProps;

export default Title;
