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
    id: 'player.chat.message.externalVideo.name',
    description: 'Label for the external video message name',
  },
});

const propTypes = {
  active: PropTypes.bool,
  player: PropTypes.object,
  url: PropTypes.url,
  timestamp: PropTypes.number,
};

const defaultProps = {
  active: false,
  player: {},
  url: '',
  timestamp: 0,
};

const ExternalVideo = ({
  active,
  player,
  url,
  timestamp,
}) => {
  const intl = useIntl();

  return (
    <SystemMessage
      active={active}
      icon={ID.EXTERNAL_VIDEOS}
      name={intl.formatMessage(intlMessages.name)}
      player={player}
      timestamp={timestamp}
    >
      <Url
        active={active}
        url={url}
      />
    </SystemMessage>
  );
};

ExternalVideo.propTypes = propTypes;
ExternalVideo.defaultProps = defaultProps;

// Checks the message active state
const areEqual = (prevProps, nextProps) => {
  if (prevProps.active !== nextProps.active) return false;

  if (!prevProps.player && nextProps.player) return false;

  return true;
};

export default React.memo(ExternalVideo, areEqual);
