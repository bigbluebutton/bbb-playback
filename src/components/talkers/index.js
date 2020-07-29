import React, { PureComponent } from 'react';
import { defineMessages } from 'react-intl';
import cx from 'classnames';
import Avatar from 'components/utils/avatar';
import {
  ID,
  isEmpty,
} from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.talkers.wrapper.aria',
    description: 'Aria label for the talkers wrapper',
  },
});

export default class Talkers extends PureComponent {
  renderTalkers(talkers) {
    return (
      <div className="talkers">
        {talkers.map(talker => {
          const {
            active,
            initials,
            name,
          } = talker;

          return (
            <div
              className={cx('talker', { inactive: !active })}>
              <Avatar
                initials={initials}
                name={name}
              />
            </div>
          );
        })}
      </div>
    );
  }

  render() {
    const {
      intl,
      talkers,
    } = this.props;

    if (isEmpty(talkers)) return null;

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className="talkers-wrapper"
        id={ID.TALKERS}
        tabIndex="0"
      >
        {this.renderTalkers(talkers)}
      </div>
    );
  }
}
