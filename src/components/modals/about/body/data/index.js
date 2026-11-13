import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Item from './item';
import {
  CONTENT,
  ID,
} from 'utils/constants';
import storage from 'utils/data/storage';
import './index.scss';

const intlMessages = defineMessages({
  title: {
    id: 'player.about.modal.content.title',
    description: 'Heading for what the recording contains',
  },
  available: {
    id: 'player.about.modal.content.available',
    description: 'Screen reader text for content the recording has',
  },
  unavailable: {
    id: 'player.about.modal.content.unavailable',
    description: 'Screen reader text for content the recording does not have',
  },
  [ID.USERS]: {
    id: 'player.about.modal.content.users',
    description: 'Label for the number of participants',
  },
  [ID.PRESENTATION]: {
    id: 'player.about.modal.content.presentation',
    description: 'Label for the presentation slides',
  },
  [ID.CHAT]: {
    id: 'player.about.modal.content.chat',
    description: 'Label for the chat',
  },
  [ID.POLLS]: {
    id: 'player.about.modal.content.polls',
    description: 'Label for the polls',
  },
  [ID.VIDEOS]: {
    id: 'player.about.modal.content.videos',
    description: 'Label for the shared videos',
  },
  [ID.NOTES]: {
    id: 'player.about.modal.content.notes',
    description: 'Label for the shared notes',
  },
  [ID.SCREENSHARE]: {
    id: 'player.about.modal.content.screenshare',
    description: 'Label for the screen sharing',
  },
  [ID.CAPTIONS]: {
    id: 'player.about.modal.content.captions',
    description: 'Label for the captions',
  },
});

const Data = () => {
  const intl = useIntl();
  const label = (item) => (intlMessages[item] ? intl.formatMessage(intlMessages[item]) : item);

  return (
    <section className="body-data" aria-labelledby="about-content-title">
      <h3 className="about-section-title" id="about-content-title">
        {intl.formatMessage(intlMessages.title)}
      </h3>
      <ul className="items">
        <Item
          icon={ID.USERS}
          key={ID.USERS}
          label={label(ID.USERS)}
          value={storage.metadata.participants}
        />
        {CONTENT.map((item) => {
          const value = storage.content[item];
          const state = intl.formatMessage(value ? intlMessages.available : intlMessages.unavailable);

          return (
            <Item
              icon={item}
              key={item}
              label={label(item)}
              state={state}
              value={value}
            />
          );
        })}
      </ul>
    </section>
  );
};

export default Data;
