import React, { useMemo } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import cx from 'classnames';
import Icon from 'components/utils/icon';
import {
  useCurrentIndex,
  useWatched,
} from 'components/utils/hooks';
import { buildChapters } from 'utils/chapters';
import { ID } from 'utils/constants';
import { buildFileURL } from 'utils/data';
import { getThumbnailItems } from 'components/thumbnails/utils';
import getDuration from 'utils/duration';
import { formatTime } from 'utils/format';
import player from 'utils/player';
import { coverage } from 'utils/watched';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.chapters.wrapper.aria',
    description: 'Aria label for the chapters panel',
  },
  slide: {
    id: 'player.search.modal.slide',
    description: 'Fallback chapter title',
  },
  screenshare: {
    id: 'player.chapters.screenshare',
    description: 'Title of a screen share chapter',
  },
  watched: {
    id: 'player.chapters.watched',
    description: 'Accessible watched state of a chapter',
  },
});

// Ring that fills as the chapter is watched, a check once done
const Progress = ({ ratio, label }) => {
  if (ratio >= 0.9) {
    return (
      <span className="chapter-progress done" title={label}>
        <Icon name="check" />
      </span>
    );
  }

  const circumference = 2 * Math.PI * 9;

  return (
    <span className="chapter-progress" title={label}>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <circle
          className="chapter-progress-value"
          cx="12"
          cy="12"
          r="9"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
        />
      </svg>
    </span>
  );
};

const Chapters = () => {
  const intl = useIntl();
  const ranges = useWatched();
  const chapters = useMemo(() => buildChapters(getThumbnailItems(), getDuration()), []);
  const current = useCurrentIndex(chapters);

  const jump = (time) => {
    if (player.primary) player.primary.currentTime(time);
  };

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      role="region"
      className="chapters-wrapper"
      id={ID.CHAPTERS}
    >
      <ol className="chapters-list">
        {chapters.map((chapter, index) => {
          const length = chapter.end - chapter.start;
          const ratio = length > 0 ? coverage(ranges, chapter.start, chapter.end) / length : 0;
          const percent = Math.round(Math.min(1, ratio) * 100);
          const title = chapter.screenshare
            ? intl.formatMessage(intlMessages.screenshare)
            : chapter.title || intl.formatMessage(intlMessages.slide, { number: chapter.number });

          return (
            <li key={`${chapter.number}-${chapter.start}`}>
              <button
                aria-current={index === current ? 'true' : undefined}
                className={cx('chapter', { active: index === current })}
                onClick={() => jump(chapter.start)}
                type="button"
              >
                <span className={cx('chapter-thumbnail', { screenshare: chapter.screenshare })}>
                  {chapter.screenshare ? (
                    <Icon name={ID.SCREENSHARE} />
                  ) : (
                    <img
                      alt=""
                      decoding="async"
                      loading="lazy"
                      src={buildFileURL(chapter.src)}
                    />
                  )}
                  <span className="chapter-number">{chapter.number}</span>
                </span>
                <span className="chapter-info">
                  <span className="chapter-title" dir="auto">{title}</span>
                  <span className="chapter-meta">
                    <bdi>{formatTime(chapter.start)}</bdi>
                    {length > 0 ? <span>· <bdi>{formatTime(length)}</bdi></span> : null}
                  </span>
                </span>
                <Progress
                  label={intl.formatMessage(intlMessages.watched, { percent })}
                  ratio={Math.min(1, ratio)}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Chapters;
