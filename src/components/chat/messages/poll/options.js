import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { getPollLabel } from 'utils/data';
import { isEmpty } from 'utils/data/validators';
import './index.scss';

const intlMessages = defineMessages({
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

const propTypes = {
  answers: PropTypes.array,
  type: PropTypes.string,
};

const defaultProps = {
  answers: [],
  type: '',
};

const Options = ({
  answers,
  type,
}) => {
  const intl = useIntl();

  if (isEmpty(answers)) return null;

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
};

Options.propTypes = propTypes;
Options.defaultProps = defaultProps;

export default Options;
