import React from 'react';
import {
  getBar,
  getPercentage,
} from 'utils/data';
import './index.scss';

const Result = ({ answers, responders }) => {
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
};

export default Result;
