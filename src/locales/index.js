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

// Missing strings fall back from region (pt_BR) to language (pt) to English
const getMessages = (locale) => {
  const file = localeToFile(locale);
  const [ language, ] = file.split('_');

  return {
    ...messages[FALLBACK_LOCALE],
    ...messages[language],
    ...messages[file],
  };
};

export {
  getLocale,
  getMessages,
}
