import messages from './messages';

const DEFAULT_LOCALE = 'en';

const getLocale = () => {
  const locale = navigator.language.split(/[-_]/)[0];

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
