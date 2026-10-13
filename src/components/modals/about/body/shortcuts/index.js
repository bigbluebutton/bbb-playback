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

// Single key controls, see addPlainShortcuts
const PLAIN_SHORTCUTS = [
  { label: 'play', keys: ['Space', 'K'] },
  { label: 'seek.backward', keys: ['←', 'J'] },
  { label: 'seek.forward', keys: ['→', 'L'] },
  { label: 'fullscreen', keys: ['F'] },
  { label: 'mute', keys: ['M'] },
  { label: 'speed', keys: ['<', '>'] },
  { label: 'bookmark', keys: ['B'] },
  { label: 'help', keys: ['?'] },
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
  'mute': {
    id: 'player.about.modal.shortcuts.mute',
    description: 'Label for the about modal mute shortcut',
  },
  'speed': {
    id: 'player.about.modal.shortcuts.speed',
    description: 'Label for the about modal speed shortcut',
  },
  'bookmark': {
    id: 'player.about.modal.shortcuts.bookmark',
    description: 'Label for the about modal bookmark shortcut',
  },
  'help': {
    id: 'player.about.modal.shortcuts.help',
    description: 'Label for the about modal help shortcut',
  },
  quick: {
    id: 'player.about.modal.shortcuts.quick',
    description: 'Heading for the single key shortcuts',
  },
  or: {
    id: 'player.about.modal.shortcuts.or',
    description: 'Separator between alternative keys',
  },
});

// Keys pressed together, joined by "+"
const Combo = ({ keys }) => (
  <span className="keys">
    {keys.map((key, index) => (
      <React.Fragment key={key}>
        {index > 0 ? <span className="plus" aria-hidden="true">+</span> : null}
        <Key code={key} />
      </React.Fragment>
    ))}
  </span>
);

const Shortcuts = () => {
  const intl = useIntl();
  const alt = intl.formatMessage(intlMessages.alt);
  const shift = intl.formatMessage(intlMessages.shift);

  return (
    <section className="body-shortcuts" aria-labelledby="about-shortcuts-title">
      <h3 className="about-section-title" id="about-shortcuts-title">
        {intl.formatMessage(intlMessages.title)}
      </h3>
      {config.plain !== false ? (
        <div className="group">
          <h4 className="group-title">
            {intl.formatMessage(intlMessages.quick)}
          </h4>
          <ul className="list">
            {PLAIN_SHORTCUTS.map(({ label, keys }) => (
              <li className="shortcut" key={`plain-${label}`}>
                <span className="label">
                  {intl.formatMessage(intlMessages[label])}
                </span>
                <span className="keys">
                  {keys.map((key, index) => (
                    <React.Fragment key={key}>
                      {index > 0 ? (
                        <span className="or">{intl.formatMessage(intlMessages.or)}</span>
                      ) : null}
                      <Key code={key} />
                    </React.Fragment>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="group">
        {config.plain !== false ? (
          <h4 className="group-title">
            {alt} + {shift}
          </h4>
        ) : null}
        <ul className="list">
          {SHORTCUTS.map(shortcut => (
            <li className="shortcut" key={shortcut}>
              <span className="label">
                {intl.formatMessage(intlMessages[shortcut])}
              </span>
              <Combo keys={[alt, shift, getCode(shortcut)]} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Shortcuts;
