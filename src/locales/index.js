import { locale as config } from 'config';
import messages from './messages';

const RTL_LOCALES = ['ar', 'fa'];

const setDirection = (locale) => {
  if (RTL_LOCALES.includes(locale)) {
    document.body.parentNode.setAttribute('dir', 'rtl');
  } else {
    document.body.parentNode.setAttribute('dir', 'ltr');
  }
};

const getLocale = () => {
  const locale = navigator.language.split(/[-_]/)[0];

  setDirection(locale);

  if (!messages[locale]) return config.default;

  return locale;
};

const getMessages = () => {
  return messages;
};

export {
  getLocale,
  getMessages,
}
