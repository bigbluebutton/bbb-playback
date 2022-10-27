import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { ID } from 'utils/constants';
import storage from 'utils/data/storage';
import './index.scss';
import { useCurrentIndex } from 'components/utils/hooks';

const intlMessages = defineMessages({
  aria: {
    id: 'player.notes.wrapper.aria',
    description: 'Aria label for the notes wrapper',
  },
  noNotes: {
    id: 'player.notes.message.noNotes'
  },
  notesToCome: {
    id: 'player.notes.message.notesToCome'
  }
});

const Notes = () => {
  const intl = useIntl();
  const currentIndex = useCurrentIndex(storage.notes);
  let note;
  if ( !storage.notes && storage.notes_fallback ) {
    note = storage.notes_fallback;
  }else if ( storage.notes ){
    if (currentIndex === -1) {
      note = `<span style='color:rgba(0, 0, 0, 0.17);'>--- ${intl.formatMessage(intlMessages.notesToCome)} ---</span>`;
    } else {
      note = storage.notes[currentIndex].text;
    }
  } else if (!storage.notes && !storage.notes_fallback) {
    note = `<span style='color:rgba(0, 0, 0, 0.17);'>--- ${intl.formatMessage(intlMessages.noNotes)} ---</span>`;
  }
  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="notes-wrapper"
      id={ID.NOTES}
      tabIndex="0"
    >
      <div className="notes">
        <div
          dangerouslySetInnerHTML={{ __html: note }}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

// Avoid re-render
const areEqual = () => true;

export default React.memo(Notes, areEqual);
