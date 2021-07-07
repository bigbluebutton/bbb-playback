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
});

const propTypes = {
  active: PropTypes.bool,
  answers: PropTypes.array,
  player: PropTypes.object,
  question: PropTypes.string,
  responders: PropTypes.number,
  timestamp: PropTypes.number,
  type: PropTypes.string,
};

const defaultProps = {
  active: false,
  answers: [],
  player: {},
  question: '',
  responders: 0,
  timestamp: 0,
  type: '',
};

const Poll = ({
  active,
  answers,
  player,
  question,
  responders,
  timestamp,
  type,
}) => {
  const intl = useIntl();

  return (
    <SystemMessage
      active={active}
      icon={ID.POLLS}
      name={intl.formatMessage(intlMessages.name)}
      player={player}
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
      />
    </SystemMessage>
  );
};

Poll.propTypes = propTypes;
Poll.defaultProps = defaultProps;

// Checks the message active state
const areEqual = (prevProps, nextProps) => {
  if (prevProps.active !== nextProps.active) return false;

  if (!prevProps.player && nextProps.player) return false;

  return true;
};

export default React.memo(Poll, areEqual);
