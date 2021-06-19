import React, { Component } from 'react';
import {
  defineMessages,
  FormattedTime,
} from 'react-intl';
import cx from 'classnames';
import Avatar from 'components/utils/avatar';
import {
  ID,
  getBar,
  getPercentage,
  getPollLabel,
  getTimestampAsMilliseconds,
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

  renderAvatar(active) {
    const { onClick } = this.props;

    return (
      <div
        className={cx('interactive', { inactive: !active })}
        onClick={onClick}
        onKeyPress={(e) => e.key === 'Enter' ? onClick() : null}
        tabIndex="0"
      >
        <Avatar
          active={active}
          icon="polls"
          name={ID.POLLS}
        />
      </div>
    );
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

  renderContent(active) {
    const {
      intl,
      timestamp,
    } = this.props;

    const milliseconds = getTimestampAsMilliseconds(timestamp);

    return (
      <div className="data">
        <div className="info">
          <div className={cx('name', { inactive: !active })}>
            {intl.formatMessage(intlMessages.name)}
          </div>
          <div className={cx('time', { inactive: !active })}>
            <FormattedTime
              hourCycle="h23"
              hour="numeric"
              minute="numeric"
              second="numeric"
              timeZone="UTC"
              value={milliseconds}
            />
          </div>
        </div>
        <div className={cx('text', { inactive: !active })}>
          <div className="poll-wrapper">
            {this.renderQuestion(intl)}
            {this.renderResult()}
            {this.renderOptions(intl)}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const {
      active,
    } = this.props;

    return (
      <div className="message">
        {this.renderAvatar(active)}
        {this.renderContent(active)}
      </div>
    );
  }
}
