import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
import Message from './message';
import {
  getBar,
  getPercentage,
  getPollLabel,
} from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  name: {
    id: 'player.chat.message.poll.name',
    description: 'Label for the poll message name',
  },
  question: {
    id: 'player.chat.message.poll.question',
    description: 'Label for the poll message question',
  },
  options: {
    id: 'player.chat.message.poll.options',
    description: 'Label for the poll message answer options',
  },
  yes: {
    id: 'player.chat.message.poll.option.yes',
    description: 'Label for poll option yes',
  },
  no: {
    id: 'player.chat.message.poll.option.no',
    description: 'Label for poll option no',
  },
  abstention: {
    id: 'player.chat.message.poll.option.abstention',
    description: 'Label for poll option abstention',
  },
  true: {
    id: 'player.chat.message.poll.option.true',
    description: 'Label for poll option true',
  },
  false: {
    id: 'player.chat.message.poll.option.false',
    description: 'Label for poll option false',
  },
});

export default class PollMessage extends Component {
  shouldComponentUpdate(nextProps) {
    const { active } = this.props;

    if (active !== nextProps.active) return true;

    return false;
  }

  renderQuestion(intl) {
    const { question } = this.props;

    if (question.length === 0) return null;

    return (
      <div className="poll-question">
        <div className="poll-label">
          {intl.formatMessage(intlMessages.question)}
        </div>
        {question}
      </div>
    );
  }

  renderResult() {
    const {
      answers,
      responders,
    } = this.props;

    if (answers.length === 0) return null;

    return (
      <div className="poll-result">
        {answers.map((item) => {
          const {
            id,
            numVotes,
          } = item;

          const percentage = getPercentage(numVotes, responders);

          return(
            <div className="poll-label">
              {id + 1}: <span className="poll-bar">{getBar(percentage)}</span> {percentage}%
            </div>
          );
        })}
      </div>
    );
  }

  renderOptions(intl) {
    const {
      answers,
      type,
    } = this.props;

    if (answers.length === 0) return null;

    return (
      <div className="poll-options">
        <div className="poll-label">
          {intl.formatMessage(intlMessages.options)}
        </div>
        {answers.map((item) => {
          const {
            id,
            key,
          } = item;

          const label = getPollLabel(key, type);

          return(
            <div>
              {id + 1}: {label ? intl.formatMessage(intlMessages[label]) : key}
            </div>
          );
        })}
      </div>
    );
  }

  renderContent(intl) {
    return (
      <div className="poll-wrapper">
        {this.renderQuestion(intl)}
        {this.renderResult()}
        {this.renderOptions(intl)}
      </div>
    );
  }

  render() {
    const {
      active,
      intl,
      onClick,
      timestamp,
    } = this.props;

    return (
      <Message
        active={active}
        icon="polls"
        onClick={onClick}
        name={intl.formatMessage(intlMessages.name)}
        timestamp={timestamp}
      >
        {this.renderContent(intl)}
      </Message>
    );
  }
}
