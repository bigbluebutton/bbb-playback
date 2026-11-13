import React from 'react';
import cx from 'classnames';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Icon from 'components/utils/icon';
import { ID } from 'utils/constants';
import layout from 'utils/layout';
import './index.scss';

// Full names, shown as tooltips
const intlMessages = defineMessages({
  [ID.CHAT]: {
    id: 'button.chat.aria',
    description: 'Aria label for the chat button',
  },
  [ID.NOTES]: {
    id: 'button.notes.aria',
    description: 'Aria label for the notes button',
  },
  [ID.CHAPTERS]: {
    id: 'button.chapters.aria',
    description: 'Aria label for the chapters button',
  },
  [ID.TRANSCRIPT]: {
    id: 'button.transcript.aria',
    description: 'Aria label for the transcript button',
  },
  [ID.BOOKMARKS]: {
    id: 'button.bookmarks.aria',
    description: 'Aria label for the bookmarks button',
  },
});

// Short names shown under each icon
const tabMessages = defineMessages({
  [ID.CHAT]: {
    id: 'player.tab.chat',
    description: 'Short name under the chat tab icon',
  },
  [ID.NOTES]: {
    id: 'player.tab.notes',
    description: 'Short name under the shared notes tab icon',
  },
  [ID.CHAPTERS]: {
    id: 'player.tab.chapters',
    description: 'Short name under the chapters tab icon',
  },
  [ID.TRANSCRIPT]: {
    id: 'player.tab.transcript',
    description: 'Short name under the transcript tab icon',
  },
  [ID.BOOKMARKS]: {
    id: 'player.tab.bookmarks',
    description: 'Short name under the bookmarks tab icon',
  },
});

const ICONS = {
  [ID.BOOKMARKS]: 'bookmark',
  [ID.CHAPTERS]: 'chapters',
  [ID.TRANSCRIPT]: 'captions',
};

const Control = ({
  applications,
  current,
  toggleApplication,
}) => {
  const intl = useIntl();

  if (!layout.control) return null;

  return (
    <div className="application-control">
      {applications.map(application => {
        const active = current === application;
        const name = intl.formatMessage(intlMessages[application]);
        const label = intl.formatMessage(tabMessages[application]);

        // The visible name is the button's name; the full one is a tooltip
        return (
          <button
            aria-pressed={active}
            className={cx('application-icon', { inactive: !active })}
            key={application}
            onClick={() => active ? null : toggleApplication(application)}
            title={name}
            type="button"
          >
            <span className="application-icon-glyph" aria-hidden="true">
              <Icon name={ICONS[application] || application} />
            </span>
            <span className="application-icon-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  return prevProps.current === nextProps.current;
};

export default React.memo(Control, areEqual);
