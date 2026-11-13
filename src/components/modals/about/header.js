import React from 'react';
import {
  FormattedDate,
  FormattedTime,
} from 'react-intl';
import { date } from 'config';
import storage from 'utils/data/storage';
import './index.scss';

const Header = () => {
  const {
    end,
    name,
    start,
  } = storage.metadata;

  const subtitle = [];
  if (date.enabled) {
    subtitle.push(
      <FormattedDate
        value={new Date(start)}
        day="numeric"
        month="long"
        year="numeric"
      />
    );

    subtitle.push(<FormattedTime value={new Date(start)} />);
    subtitle.push(<FormattedTime value={new Date(end)} />);
  }

  return (
    <div className="about-header">
      <h2 className="title">
        {name}
      </h2>
      {subtitle.length > 0 ? (
        <div className="subtitle">
          <span className="item">{subtitle[0]}</span>
          <span className="item">
            {subtitle[1]}
            <span aria-hidden="true"> – </span>
            {subtitle[2]}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default Header;
