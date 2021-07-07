import React from 'react';
import PropTypes from 'prop-types';
import {
  getBar,
  getPercentage,
} from 'utils/data';
import { isEmpty } from 'utils/data/validators';
import './index.scss';

const propTypes = {
  answers: PropTypes.array,
  responders: PropTypes.number,
};

const defaultProps = {
  answers: [],
  responders: 0,
};

const Result = ({
  answers,
  responders,
}) => {
  if (isEmpty(answers)) return null;

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
};

Result.propTypes = propTypes;
Result.defaultProps = defaultProps;

export default Result;
