import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';

const intlMessages = defineMessages({
  section: {
    id: 'button.section.aria',
    description: 'Aria label for the section button',
  },
});

const Section = ({ enabled, section, toggleSection }) => {
  const intl = useIntl();

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
