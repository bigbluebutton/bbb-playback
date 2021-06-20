import React from 'react';
import { defineMessages } from 'react-intl';
import { ID } from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.notes.wrapper.aria',
    description: 'Aria label for the notes wrapper',
  },
});

const Notes = ({ intl, notes }) => {
  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="notes-wrapper"
      id={ID.NOTES}
      tabIndex="0"
    >
      <div className="notes">
        <div dangerouslySetInnerHTML={{ __html: notes }} />
      </div>
    </div>
  );
};

// Avoid re-render
const areEqual = () => true;

export default React.memo(Notes, areEqual);
