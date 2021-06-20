import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Options from './options';
import Question from './question';
import Result from './result';
import Message from '../message';
import { ID } from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  name: {
    id: 'player.chat.message.poll.name',
    description: 'Label for the poll message name',
  },
});

const Poll = (props) => {
  const { answers } = props;
  const intl = useIntl();

  return (
    <Message
      active={props.active}
      icon={ID.POLLS}
      onClick={props.onClick}
      name={intl.formatMessage(intlMessages.name)}
      timestamp={props.timestamp}
    >
      <div className="poll-wrapper">
        <Question question={props.question} />
        <Result
          answers={answers}
          responders={props.responders}
        />
        <Options
          answers={answers}
          type={props.type}
        />
      </div>
    </Message>
  );
};

// Checks the message active state
const areEqual = (prevProps, nextProps) => {
  return prevProps.active === nextProps.active;
};

export default React.memo(Poll, areEqual);
