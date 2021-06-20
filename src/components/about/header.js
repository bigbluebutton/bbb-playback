import React from 'react';
import {
  FormattedDate,
  FormattedTime,
} from 'react-intl';
import './index.scss';

const Header = ({ metadata }) => {
  const {
    end,
    name,
    start,
  } = metadata;

  const subtitle = [];
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

  return (
    <div className="about-header">
      <div className="title">
        {name}
      </div>
      <div className="subtitle">
        {subtitle.map(s => <div className="item">{s}</div>)}
      </div>
    </div>
  );
};

export default Header;
