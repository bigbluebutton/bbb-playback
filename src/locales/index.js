import messages from './messages';

const DEFAULT_LOCALE = 'en';

const RTL_LOCALES = ['ar'];

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

  if (!messages[locale]) return DEFAULT_LOCALE;

  return locale;
};

const getMessages = () => {
  return messages;
};

export {
  getLocale,
  getMessages,
}
