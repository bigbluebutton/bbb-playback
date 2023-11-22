import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { ID } from 'utils/constants';
import storage from 'utils/data/storage';
import '../index.scss';

const intlMessages = defineMessages({
    noNotes: {
      id: 'player.notes.message.noNotes'
    },
});

const NotesStatic = () => {
  const intl = useIntl();

  let note;
  if ( storage.notes_static ) {
    note = storage.notes_static;
  }else {
    note = `<span style='color:rgba(0, 0, 0, 0.17);'>--- ${intl.formatMessage(intlMessages.noNotes)} ---</span>`;
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: note }}
      style={{ width: '100%' }}
    />
  );
};

// Avoid re-render
const areEqual = () => true;

export default React.memo(NotesStatic, areEqual);
