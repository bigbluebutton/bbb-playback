import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import { controls as config } from 'config';
import layout from 'utils/layout';

const intlMessages = defineMessages({
  section: {
    id: 'button.section.aria',
    description: 'Aria label for the section button',
  },
});

const propTypes = {
  section: PropTypes.bool,
  toggleSection: PropTypes.func,
};

const defaultProps = {
  section: true,
  toggleSection: () => {},
};

const Section = ({
  section,
  toggleSection,
}) => {
  const intl = useIntl();

  if (!layout.control || !config.section) return null;

  return (
    <Button
      aria={intl.formatMessage(intlMessages.section)}
      circle
      handleOnClick={toggleSection}
      icon={section ? 'left' : 'right'}
    />
  );
};

Section.propTypes = propTypes;
Section.defaultProps = defaultProps;

export default Section;
