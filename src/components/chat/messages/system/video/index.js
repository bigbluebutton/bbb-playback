import React from 'react';
import PropTypes from 'prop-types';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Url from './url';
import SystemMessage from 'components/chat/messages/system/message';
import { ID } from 'utils/constants';

const intlMessages = defineMessages({
  name: {
    id: 'player.chat.message.video.name',
    description: 'Label for the video message name',
  },
});

const propTypes = {
  active: PropTypes.bool,
  url: PropTypes.url,
  timestamp: PropTypes.number,
};

const defaultProps = {
  active: false,
  url: '',
  timestamp: 0,
};

const Video = ({
  active,
  url,
  timestamp,
}) => {
  const intl = useIntl();

  return (
    <SystemMessage
      active={active}
      icon={ID.VIDEOS}
      name={intl.formatMessage(intlMessages.name)}
      timestamp={timestamp}
    >
      <Url
        active={active}
        url={url}
      />
    </SystemMessage>
  );
};

Video.propTypes = propTypes;
Video.defaultProps = defaultProps;

// Checks the message active state
const areEqual = (prevProps, nextProps) => {
  if (prevProps.active !== nextProps.active) return false;

  return true;
};

export default React.memo(Video, areEqual);
