import { locale as config } from 'config';
import messages from './messages';
import { getSearchParam } from 'utils/params';

const RTL_LOCALES = ['ar', 'dv', 'fa', 'he'];
const FALLBACK_LOCALE = 'en';

const localeToFile = (locale) => locale.replace('-', '_');

const fileToLocale = (locale) => locale.replace('_', '-');

const setDirection = (language) => {
  if (RTL_LOCALES.includes(language)) {
    document.body.parentNode.setAttribute('dir', 'rtl');
  } else {
    document.body.parentNode.setAttribute('dir', 'ltr');
  }
};

const getLocale = () => {
  const locale = getSearchParam('locale') || navigator.language;

  let file = localeToFile(locale);
  let [ language, ] = file.split('_');

  // If the locale is missing, try the language fallback
  if (!messages[file]) {
    if (messages[language]) {
      file = language;
    } else {
      file = config.default;
      [ language, ] = config.default.split('_');
    }
  }

  setDirection(language);

  return fileToLocale(file);
};

const getMessages = (locale) => {
  const file = localeToFile(locale);
  if (file !== FALLBACK_LOCALE) {
    return Object.assign(messages[FALLBACK_LOCALE], messages[file]);
  }

  return messages[file];
};

export {
  getLocale,
  getMessages,
}
