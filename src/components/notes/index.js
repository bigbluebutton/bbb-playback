import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import { ID } from 'utils/constants';
import './index.scss';

const intlMessages = defineMessages({
  aria: {
    id: 'player.notes.wrapper.aria',
    description: 'Aria label for the notes wrapper',
  },
});

const propTypes = { notes: PropTypes.text };

const defaultProps = { notes: '' };

const Notes = ({ notes }) => {
  const intl = useIntl();

  return (
    <div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className="notes-wrapper"
      id={ID.NOTES}
      tabIndex="0"
    >
      <div className="notes">
        <div dangerouslySetInnerHTML={{ __html: notes }} />
      </div>
    </div>
  );
};

Notes.propTypes = propTypes;
Notes.defaultProps = defaultProps;

// Avoid re-render
const areEqual = () => true;

export default React.memo(Notes, areEqual);
