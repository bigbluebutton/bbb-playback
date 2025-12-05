import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import '../index.scss';
import DOMPurify from 'dompurify';

const propTypes = {
  active: PropTypes.bool,
  idToReference: PropTypes.string,
  text: PropTypes.string,
};

const defaultProps = {
  active: false,
  idToReference: '',
  text: '',
};

const Reply = ({
  active,
  idToReference,
  scrollTo,
  text,
}) => {

  const handleClickReply = () => {
    const messageReplied = document.getElementById(idToReference);
    scrollTo(messageReplied);
    messageReplied.classList.add('highlight')
    setTimeout(() => 
      messageReplied.classList.remove('highlight'), 800
    );
  }

  return (
    <span
      onClick={handleClickReply}
      className={cx('reply-tag', 'text-vanilla', {inactive: !active})}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
    >
    </span>
  );
};

Reply.propTypes = propTypes;
Reply.defaultProps = defaultProps;

// Checks the message active state
const areEqual = (prevProps, nextProps) => {
  if (prevProps.active !== nextProps.active) return false;

  return true;
};

export default React.memo(Reply, areEqual);
