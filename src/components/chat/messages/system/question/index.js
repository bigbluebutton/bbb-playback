import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Answer from './answer';
import Text from './text';
import SystemMessage from 'components/chat/messages/system/message';
import { ID } from 'utils/constants';
import './index.scss';

const intlMessages = defineMessages({
  name: {
    id: 'player.chat.message.question.name',
    description: 'Label for the question message name',
  },
});

const propTypes = {
  active: PropTypes.bool,
  answer: PropTypes.string,
  text: PropTypes.text,
  timestamp: PropTypes.number,
};

const defaultProps = {
  active: false,
  answer: '',
  text: '',
  timestamp: 0,
};

const Question = ({
  active,
  answer,
  text,
  timestamp,
}) => {
  const intl = useIntl();

  return (
    <SystemMessage
      active={active}
      icon={ID.QUESTIONS}
      name={intl.formatMessage(intlMessages.name)}
      timestamp={timestamp}
    >
      <Text text={text} />
      <Answer answer={answer} />
    </SystemMessage>
  );
};

Question.propTypes = propTypes;
Question.defaultProps = defaultProps;

// Checks the message active state
const areEqual = (prevProps, nextProps) => {
  if (prevProps.active !== nextProps.active) return false;

  return true;
};

export default React.memo(Question, areEqual);
