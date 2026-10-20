import { defineMessages } from 'react-intl';
import { EVENTS, ID } from 'utils/constants';
import bookmarks from 'utils/bookmarks';
import storage from 'utils/data/storage';
import { formatTime } from 'utils/format';
import player from 'utils/player';
import notify from 'utils/toast';

const intlMessages = defineMessages({
  added: {
    id: 'player.bookmarks.added',
    description: 'Message shown after a bookmark is added',
  },
  addNote: {
    id: 'player.bookmarks.addNote',
    description: 'Toast action to write a note for the new bookmark',
  },
});

const openPanel = (panel, detail = {}) => {
  document.dispatchEvent(new CustomEvent(EVENTS.OPEN_PANEL, { detail: { panel, ...detail } }));
};

// Bookmarks the current moment and offers to write a note for it
const addBookmarkNow = (intl) => {
  if (!player.primary || !storage.metadata) return;

  const time = player.primary.currentTime();
  const bookmark = bookmarks.add(storage.metadata.id, time);
  if (!bookmark) return;

  notify({
    action: {
      label: intl.formatMessage(intlMessages.addNote),
      onClick: () => openPanel(ID.BOOKMARKS, { focus: bookmark.id }),
    },
    duration: 6000,
    message: intl.formatMessage(intlMessages.added, { time: formatTime(bookmark.time) }),
  });
};

export {
  addBookmarkNow,
  openPanel,
};
