import React, { useEffect, useRef, useState } from 'react';
import Icon from 'components/utils/icon';
import { EVENTS } from 'utils/constants';
import getDuration from 'utils/duration';
import { formatTime } from 'utils/format';

// Time updates only flow while the media plays
const IDLE = 600;

// Live playback position with an equalizer that moves while playing
const Status = () => {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const idle = useRef();
  const duration = getDuration();

  useEffect(() => {
    const handleTimeUpdate = (event) => {
      setTime(Math.floor(event.detail.time));
      // A jump while paused is not playback
      if (event.detail.seek) return;

      setPlaying(true);
      clearTimeout(idle.current);
      idle.current = setTimeout(() => setPlaying(false), IDLE);
    };

    document.addEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);

    return () => {
      document.removeEventListener(EVENTS.TIME_UPDATE, handleTimeUpdate);
      clearTimeout(idle.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={playing ? 'playback-status playing' : 'playback-status'}
    >
      {playing ? (
        <span className="equalizer">
          <span />
          <span />
          <span />
        </span>
      ) : (
        <span className="paused">
          <Icon name="pause" />
        </span>
      )}
      <bdi className="playback-time">
        {formatTime(time)}
        {duration ? <span className="playback-duration"> / {formatTime(duration)}</span> : null}
      </bdi>
    </div>
  );
};

export default Status;
