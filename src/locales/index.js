import { locale as config } from 'config';
import messages from './messages';
import { getSearchParam } from 'utils/params';

const RTL_LOCALES = ['ar', 'fa'];
const FALBACK_LOCALE = 'en';

const setDirection = (locale) => {
  if (RTL_LOCALES.includes(locale)) {
    document.body.parentNode.setAttribute('dir', 'rtl');
  } else {
    document.body.parentNode.setAttribute('dir', 'ltr');
  }
};

const getLocale = () => {
  // Try from the query params
  let locale = getSearchParam('locale');

  // If not, get browser default
  if (!locale) locale = navigator.language;

  // Sanitize
  locale = locale.split(/[-_]/)[0];

  // If the locale is missing, use the default fallback
  if (!messages[locale]) locale = config.default.split(/[-_]/)[0];

  setDirection(locale);

  return locale;
};

const getMessages = (locale) => {
  if (locale !== FALBACK_LOCALE) {
    return Object.assign(messages[FALBACK_LOCALE], messages[locale]);
  }

  return messages[locale];
};

export {
  getLocale,
  getMessages,
}
