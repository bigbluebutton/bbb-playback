import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { ID } from 'utils/constants';
import storage from 'utils/data/storage';
import './index.scss';
import NotesDynamic from './notes_dynamic';
import NotesStatic from './notes_static';
import { getTypeOfSharedNotes } from 'utils/params';

const intlMessages = defineMessages({
  aria: {
    id: 'player.notes.wrapper.aria',
    description: 'Aria label for the notes wrapper',
  },
  noNotes: {
    id: 'player.notes.message.noNotes'
  }
});

const Notes = () => {
  const intl = useIntl();
  const typeOfSharedNotes = getTypeOfSharedNotes();
  let isThereNoteToDisplay = true;
  let note;
  let isDynamic = true
  if ( typeOfSharedNotes !== null && typeOfSharedNotes === "static" ) {
    isDynamic = false;
  }
  if (!storage.notes_dynamic && !storage.notes_static) {
    isThereNoteToDisplay = false;
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
        { !isThereNoteToDisplay ?
          <div
          dangerouslySetInnerHTML={{ __html: note }}
          style={{ width: '100%' }}
          />
          : isDynamic ? <NotesDynamic /> : <NotesStatic />
        }
      </div>
    </div>
  );
};

// Avoid re-render
const areEqual = () => true;

export default React.memo(Notes, areEqual);
