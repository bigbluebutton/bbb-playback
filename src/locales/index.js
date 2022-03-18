import { locale as config } from 'config';
import messages from './messages';
import { getSearchParam } from 'utils/params';

const RTL_LOCALES = ['ar', 'dv', 'fa', 'he'];
const FALLBACK_LOCALE = 'en';

const setDirection = (language) => {
  if (RTL_LOCALES.includes(language)) {
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
  locale = locale.replace('-', '_');
  let [ language, ] = locale.split('_');

  // If the locale is missing, try the language fallback
  if (!messages[locale]) {
    if (messages[language]) {
      locale = language;
    } else {
      locale = config.default;
      [ language, ] = config.default.split('_');
    }
  }

  setDirection(language);

  return locale;
};

const getMessages = (locale) => {
  if (locale !== FALLBACK_LOCALE) {
    return Object.assign(messages[FALLBACK_LOCALE], messages[locale]);
  }

  return messages[locale];
};

export {
  getLocale,
  getMessages,
}
