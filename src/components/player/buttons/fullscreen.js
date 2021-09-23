import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Button from 'components/utils/button';
import layout from 'utils/layout';
import './index.scss';

const intlMessages = defineMessages({
  fullscreen: {
    id: 'button.fullscreen.aria',
    description: 'Aria label for the fullscreen button',
  },
  restore: {
    id: 'button.restore.aria',
    description: 'Aria label for the restore button',
  },
});

const Fullscreen = ({
  content,
  fullscreen,
  swap,
  toggleFullscreen,
}) => {
  const intl = useIntl();

  if (!layout.hasFullscreenButton(content, swap)) return null;

  const aria = fullscreen
    ? intl.formatMessage(intlMessages.restore)
    : intl.formatMessage(intlMessages.fullscreen)
  ;

  const icon = fullscreen ? 'restore' : 'fullscreen';

  return (
    <div className="fullscreen-button">
      <Button
        aria={aria}
        handleOnClick={() => toggleFullscreen()}
        icon={icon}
        type="solid"
      />
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.content !== nextProps.content) return false;

  if (prevProps.fullscreen !== nextProps.fullscreen) return false;

  if (prevProps.swap !== nextProps.swap) return false;

  return true;
};

export default React.memo(Fullscreen, areEqual);
