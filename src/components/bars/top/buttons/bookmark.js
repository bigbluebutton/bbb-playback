import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Icon from 'components/utils/icon';
import { addBookmarkNow } from 'components/bookmarks/actions';
import layout from 'utils/layout';

const intlMessages = defineMessages({
  bookmark: {
    id: 'button.bookmark.aria',
    description: 'Aria label for the add bookmark button',
  },
  label: {
    id: 'player.bookmark.action',
    description: 'Text on the top bar button that bookmarks the current moment',
  },
});

// The top bar's action: a labelled button that stands out from the icons
const Bookmark = () => {
  const intl = useIntl();

  if (!layout.control) return null;

  return (
    <button
      className="action-button"
      onClick={() => addBookmarkNow(intl)}
      title={intl.formatMessage(intlMessages.bookmark)}
      type="button"
    >
      <span className="action-button-icon" aria-hidden="true">
        <Icon name="bookmark" />
      </span>
      <span className="action-button-label">{intl.formatMessage(intlMessages.label)}</span>
    </button>
  );
};

export default Bookmark;
