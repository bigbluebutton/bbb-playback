import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { ID } from 'utils/constants';
import storage from 'utils/data/storage';
import '../index.scss';
import { useCurrentIndex } from 'components/utils/hooks';

const intlMessages = defineMessages({
  notesToCome: {
    id: 'player.notes.message.notesToCome'
  }
});

const NotesDynamic = () => {

  const intl = useIntl();
  const currentIndex = useCurrentIndex(storage.notes_dynamic);
  let note;
  if ( !storage.notes_dynamic && storage.notes_static ) {
    note = storage.notes_static;
  } else if ( storage.notes_dynamic ){
    if (currentIndex === -1) {
      note = `<span style='color:rgba(0, 0, 0, 0.17);'>--- ${intl.formatMessage(intlMessages.notesToCome)} ---</span>`;
    } else {
      note = storage.notes_dynamic[currentIndex].text;
    }
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

export default React.memo(NotesDynamic, areEqual);
