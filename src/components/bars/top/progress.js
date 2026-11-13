import React, { useEffect, useRef } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { useWatched } from 'components/utils/hooks';
import getDuration from 'utils/duration';
import notify from 'utils/toast';
import watched, { coverage } from 'utils/watched';

const intlMessages = defineMessages({
  watched: {
    id: 'player.progress.watched',
    description: 'Share of the recording the viewer has watched',
  },
  completed: {
    id: 'player.progress.completed',
    description: 'Message shown when the whole recording has been watched',
  },
});

const COMPLETE = 95;

// How much of the recording this viewer has watched, across visits
const Progress = () => {
  const intl = useIntl();
  const ranges = useWatched();
  const celebrated = useRef(null);

  const duration = getDuration();
  const percent = duration > 0
    ? Math.min(100, Math.round((coverage(ranges, 0, duration) / duration) * 100))
    : 0;

  useEffect(() => {
    if (!watched.isLoaded()) return;

    // Celebrate only when crossing the line during this visit
    if (celebrated.current === null) {
      celebrated.current = percent >= COMPLETE;
      return;
    }
    if (!celebrated.current && percent >= COMPLETE) {
      celebrated.current = true;
      notify({ duration: 6000, message: intl.formatMessage(intlMessages.completed) });
    }
  }, [percent, intl]);

  const label = intl.formatMessage(intlMessages.watched, { percent });

  return (
    <div
      aria-label={label}
      className="watch-progress"
      role="img"
      title={label}
    >
      <span
        className="watch-progress-ring"
        style={{ '--watched': `${percent * 3.6}deg` }}
      />
      <span className="watch-progress-value">{percent}%</span>
    </div>
  );
};

export default Progress;
