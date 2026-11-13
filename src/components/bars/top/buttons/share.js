import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { controls as config } from 'config';
import {
  buildTimeURL,
  formatTime,
} from 'utils/format';
import layout from 'utils/layout';
import logger from 'utils/logger';
import player from 'utils/player';
import notify from 'utils/toast';

const intlMessages = defineMessages({
  share: {
    id: 'button.share.aria',
    description: 'Aria label for the copy link at current time button',
  },
  copied: {
    id: 'player.share.copied',
    description: 'Message shown after the link is copied',
  },
  failed: {
    id: 'player.share.failed',
    description: 'Message shown when the link could not be copied',
  },
});

const copyWithFallback = (text) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();

  return copied ? Promise.resolve() : Promise.reject(new Error('copy failed'));
};

const copy = (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(() => copyWithFallback(text));
  }

  return copyWithFallback(text);
};

// "Copy link at current time", for the top bar's More menu
const useShareItem = () => {
  const intl = useIntl();

  if (!layout.control || config.share === false) return null;

  const handleShare = () => {
    const time = player.primary ? player.primary.currentTime() : 0;
    const url = buildTimeURL(window.location.href, time);

    copy(url).then(() => {
      notify({ message: intl.formatMessage(intlMessages.copied, { time: formatTime(time) }) });
    }).catch((error) => {
      logger.warn('share', error);
      notify({ message: intl.formatMessage(intlMessages.failed) });
    });
  };

  return {
    icon: 'link',
    key: 'share',
    label: intl.formatMessage(intlMessages.share),
    onSelect: handleShare,
  };
};

export default useShareItem;
