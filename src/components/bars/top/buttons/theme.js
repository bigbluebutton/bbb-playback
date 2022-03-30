import React, { useState } from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import {
  enable,
  disable,
} from 'darkreader';
import Button from 'components/utils/button';
import { controls as config } from 'config';
import { THEME } from 'utils/constants';
import layout from 'utils/layout';

const intlMessages = defineMessages({
  theme: {
    id: 'button.theme.aria',
    description: 'Aria label for the theme button',
  },
});

const Theme = () => {
  const intl = useIntl();
  const [dark, setDark] = useState(false);

  const toggleTheme = () => {
    dark ? disable() : enable();
    setDark(prevDark => !prevDark);
  };

  if (!layout.control || !config.theme) return null;

  return (
    <Button
      aria={intl.formatMessage(intlMessages.theme)}
      circle
      handleOnClick={toggleTheme}
      icon={dark ? THEME.LIGHT : THEME.DARK}
    />
  );
};

export default Theme;
