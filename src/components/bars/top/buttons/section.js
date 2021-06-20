import React from 'react';
import { defineMessages } from 'react-intl';
import Button from 'components/utils/button';

const intlMessages = defineMessages({
  section: {
    id: 'button.section.aria',
    description: 'Aria label for the section button',
  },
});

const Section = ({ intl, enabled, section, toggleSection }) => {
  if (!enabled) return null;

  return (
    <Button
      aria={intl.formatMessage(intlMessages.section)}
      circle
      handleOnClick={toggleSection}
      icon={section ? 'arrow-left' : 'arrow-right'}
    />
  );
};

export default Section;
