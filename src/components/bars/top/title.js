import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
  FormattedDate,
} from 'react-intl';
import {
  controls as config,
  date,
} from 'config';
import Icon from 'components/utils/icon';
import getDuration from 'utils/duration';
import { formatTime } from 'utils/format';
import storage from 'utils/data/storage';
import layout from 'utils/layout';
import './index.scss';

const intlMessages = defineMessages({
  about: {
    id: 'button.about.aria',
    description: 'Aria label for the about button',
  },
  participants: {
    id: 'player.meta.participants',
    description: 'Number of participants of the recorded meeting',
  },
});

const propTypes = { openAbout: PropTypes.func };

const defaultProps = { openAbout: () => {} };

const Title = ({ openAbout }) => {
  const intl = useIntl();
  const metadata = storage.metadata || {};
  const { name, participants, start } = metadata;
  const duration = getDuration() || null;

  // Each detail gets an icon so date, length and audience read at a glance
  const details = [];
  if (date.enabled && start) {
    details.push({
      icon: 'calendar',
      key: 'date',
      value: (
        <FormattedDate
          day="numeric"
          month="short"
          value={new Date(start)}
          year="numeric"
        />
      ),
    });
  }
  if (duration) {
    details.push({
      icon: 'clock',
      key: 'duration',
      value: <bdi>{formatTime(duration)}</bdi>,
    });
  }
  if (Number.isFinite(participants) && participants > 0) {
    details.push({
      icon: 'users',
      key: 'participants',
      value: intl.formatMessage(intlMessages.participants, { count: participants }),
    });
  }

  const content = (
    <>
      <span className="title">{name}</span>
      {details.length > 0 ? (
        <span className="meta">
          {details.map(({ icon, key, value }) => (
            <span className="chip" key={key}>
              <Icon name={icon} />
              <span>{value}</span>
            </span>
          ))}
        </span>
      ) : null}
    </>
  );

  const interactive = layout.control && config.about;
  if (!interactive) {

    return <h1 className="title-heading"><span className="title-block">{content}</span></h1>;
  }

  return (
    <h1 className="title-heading">
      <button
        aria-haspopup="dialog"
        aria-label={[name, intl.formatMessage(intlMessages.about)].filter(Boolean).join(' – ')}
        className="title-block interactive"
        onClick={openAbout}
        title={name || undefined}
        type="button"
      >
        {content}
      </button>
    </h1>
  );
};

Title.propTypes = propTypes;
Title.defaultProps = defaultProps;

export default Title;
