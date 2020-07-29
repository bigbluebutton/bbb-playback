import React, { PureComponent } from 'react';
import { defineMessages } from 'react-intl';
import { ID } from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.notes.wrapper.aria',
    description: 'Aria label for the notes wrapper',
  },
});

export default class Notes extends PureComponent {
  render() {
    const {
      intl,
      notes,
    } = this.props;

    return (
      <div
        aria-label={intl.formatMessage(intlMessages.aria)}
        className="notes-wrapper"
        id={ID.NOTES}
        tabIndex="0"
      >
        <div className="notes">
          {notes}
        </div>
      </div>
    );
  }
}
