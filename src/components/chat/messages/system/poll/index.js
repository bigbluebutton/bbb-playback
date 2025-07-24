import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Options from './options';
import Question from './question';
import Result from './result';
import SystemMessage from 'components/chat/messages/system/message';
import { ID } from 'utils/constants';
import './index.scss';

const intlMessages = defineMessages({
  name: {
    id: 'player.chat.message.poll.name',
    description: 'Label for the poll message name',
  },
  quiz: {
    id: 'player.chat.message.poll.quiz',
    description: 'Label for the quiz message name',
  },
});

const propTypes = {
  active: PropTypes.bool,
  answers: PropTypes.array,
  question: PropTypes.string,
  responders: PropTypes.number,
  timestamp: PropTypes.number,
  type: PropTypes.string,
  isQuiz: PropTypes.bool,
  showCorrectAnswer: PropTypes.bool,
};

const defaultProps = {
  active: false,
  answers: [],
  question: '',
  responders: 0,
  timestamp: 0,
  type: '',
  isQuiz: false,
  showCorrectAnswer: false,
};

const Poll = ({
  active,
  answers,
  question,
  responders,
  timestamp,
  type,
  isQuiz,
  showCorrectAnswer,
}) => {
  const intl = useIntl();

  return (
    <SystemMessage
      active={active}
      icon={ID.POLLS}
      name={isQuiz ? intl.formatMessage(intlMessages.quiz) : intl.formatMessage(intlMessages.name)}
      timestamp={timestamp}
    >
      <Question question={question} />
      <Result
        answers={answers}
        responders={responders}
      />
      <Options
        answers={answers}
        type={type}
        showCorrectAnswer={showCorrectAnswer}
      />
    </SystemMessage>
  );
};

Poll.propTypes = propTypes;
Poll.defaultProps = defaultProps;

// Checks the message active state
const areEqual = (prevProps, nextProps) => {
  if (prevProps.active !== nextProps.active) return false;

  return true;
};

export default React.memo(Poll, areEqual);
