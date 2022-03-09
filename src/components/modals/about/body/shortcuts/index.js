import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Key from './key';
import { shortcuts as config } from 'config';
import './index.scss';

const SHORTCUTS = [
  'fullscreen',
  'play',
  'section',
  'seek.backward',
  'seek.forward',
  'skip.next',
  'skip.previous',
  'swap',
];

const getCode = (shortcut) => {
  const path = shortcut.split('.');

  let code = config[path[0]];
  for (let i = 1; i < path.length; i++) {
    code = code[path[i]];
  }

  return code;
};

const intlMessages = defineMessages({
  title: {
    id: 'player.about.modal.shortcuts.title',
    description: 'Label for the about modal shortcuts title',
  },
  alt: {
    id: 'player.about.modal.shortcuts.alt',
    description: 'Label for the about modal shortcuts alt key',
  },
  shift: {
    id: 'player.about.modal.shortcuts.shift',
    description: 'Label for the about modal shortcuts shift key',
  },
  'fullscreen': {
    id: 'player.about.modal.shortcuts.fullscreen',
    description: 'Label for the about modal fullscreen shortcut',
  },
  'play': {
    id: 'player.about.modal.shortcuts.play',
    description: 'Label for the about modal play shortcut',
  },
  'section': {
    id: 'player.about.modal.shortcuts.section',
    description: 'Label for the about modal section shortcut',
  },
  'seek.backward': {
    id: 'player.about.modal.shortcuts.seek.backward',
    description: 'Label for the about modal seek backward shortcut',
  },
  'seek.forward': {
    id: 'player.about.modal.shortcuts.seek.forward',
    description: 'Label for the about modal seek forward shortcut',
  },
  'skip.next': {
    id: 'player.about.modal.shortcuts.skip.next',
    description: 'Label for the about modal skip next shortcut',
  },
  'skip.previous': {
    id: 'player.about.modal.shortcuts.skip.previous',
    description: 'Label for the about modal skip previous shortcut',
  },
  'swap': {
    id: 'player.about.modal.shortcuts.swap',
    description: 'Label for the about modal swap shortcut',
  },
});

const Shortcuts = () => {
  const intl = useIntl();

  return (
    <div className="body-shortcuts">
      <div className="title">
        {intl.formatMessage(intlMessages.title)}
      </div>
      <div className="list">
        <div className="content">
          {SHORTCUTS.map(shortcut => {

            return (
              <div className="shortcut">
                <div className="label">
                  {intl.formatMessage(intlMessages[shortcut])}
                </div>
                <div className="keys">
                  <Key code={intl.formatMessage(intlMessages.alt)} />
                  <Key code={intl.formatMessage(intlMessages.shift)} />
                  <Key code={getCode(shortcut)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Shortcuts;
