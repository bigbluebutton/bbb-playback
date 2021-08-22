import React from 'react';
import PropTypes from 'prop-types';
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

const propTypes = {
  enabled: PropTypes.bool,
  section: PropTypes.bool,
  toggleSection: PropTypes.func,
};

const defaultProps = {
  enabled: false,
  section: true,
  toggleSection: () => {},
};

const Section = ({
  enabled,
  section,
  toggleSection,
}) => {
  const intl = useIntl();

  if (!enabled) return null;

  return (
    <Button
      aria={intl.formatMessage(intlMessages.section)}
      circle
      handleOnClick={toggleSection}
      icon={section ? 'arrowLeft' : 'arrowRight'}
    />
  );
};

Section.propTypes = propTypes;
Section.defaultProps = defaultProps;

export default Section;
