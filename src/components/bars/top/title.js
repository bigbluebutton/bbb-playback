import React from 'react';
import PropTypes from 'prop-types';
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

const Title = (props) => {
  const intl = useIntl();
  const date = <FormattedDate value={new Date(props.start)} />;
  const { interactive } = props;

  if (!interactive) {

    return (
      <span className="title">
        {props.name} - {date}
      </span>
    );
  }

  return (
    <span
      aria={intl.formatMessage(intlMessages.about)}
      className={cx('title', { interactive })}
      onClick={props.toggleAbout}
      onKeyPress={event => handleOnEnterPress(event, props.toggleAbout)}
      tabIndex="0"
    >
      {props.name} - {date}
    </span>
  );
};

Title.propTypes = propTypes;
Title.defaultProps = defaultProps;

export default Title;
