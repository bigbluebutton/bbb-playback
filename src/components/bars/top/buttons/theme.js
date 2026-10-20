import React, { useEffect, useState } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import { controls as config } from 'config';
import {
  EVENTS,
  THEME,
} from 'utils/constants';
import layout from 'utils/layout';
import {
  applyTheme,
  getTheme,
  saveTheme,
} from 'utils/theme';

const intlMessages = defineMessages({
  dark: {
    id: 'button.theme.dark.aria',
    description: 'Aria label for the button that switches to the dark theme',
  },
  light: {
    id: 'button.theme.light.aria',
    description: 'Aria label for the button that switches to the light theme',
  },
});

const Theme = () => {
  const intl = useIntl();
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    const handleTheme = (event) => setTheme(event.detail.theme);
    document.addEventListener(EVENTS.THEME, handleTheme);

    return () => document.removeEventListener(EVENTS.THEME, handleTheme);
  }, []);

  if (!layout.control || !config.theme) return null;

  const dark = theme === THEME.DARK;
  const next = dark ? THEME.LIGHT : THEME.DARK;

  const toggleTheme = () => {
    saveTheme(next);
    applyTheme(next);
  };

  return (
    <Button
      aria={intl.formatMessage(dark ? intlMessages.light : intlMessages.dark)}
      circle
      handleOnClick={toggleTheme}
      icon={dark ? THEME.LIGHT : THEME.DARK}
    />
  );
};

export default Theme;
