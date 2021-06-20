import React from 'react';
import { FormattedTime } from 'react-intl';
import cx from 'classnames';
import { getTimestampAsMilliseconds } from 'utils/data';
import './index.scss';

const Info = ({ active, name, timestamp }) => {
  const milliseconds = getTimestampAsMilliseconds(timestamp);

  return (
    <div className="info">
      <div className={cx('name', { inactive: !active })}>
        {name}
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
  );
};

export default Info;
