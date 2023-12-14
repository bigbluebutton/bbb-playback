import { withSize } from 'react-sizeme'
import React from 'react';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import cx from 'classnames';
import { gte as semverGte } from 'semver';
import { Tldraw, track, useEditor } from 'tldraw-alpha';
import 'tldraw-alpha/tldraw.css';
import {
  useCurrentContent,
  useCurrentIndex,
  useCurrentInterval,
} from 'components/utils/hooks';
import { ID } from 'utils/constants';
import storage from 'utils/data/storage';
import './index.scss';
import { getTldrawBbbVersion, getTldrawData } from 'utils/tldraw';

const intlMessages = defineMessages({
  aria: {
    id: 'player.presentation.wrapper.aria',
    description: 'Aria label for the presentation wrapper',
  },
});

const TldrawPresentationV2 = ({ size }) => {
  const intl = useIntl();
  const currentContent = useCurrentContent();
  const currentPanzoomIndex = useCurrentIndex(storage.panzooms);
  const started = currentPanzoomIndex !== -1;

  return (
		<div
      aria-label={intl.formatMessage(intlMessages.aria)}
      className={cx('presentation-wrapper', { inactive: currentContent !== ID.PRESENTATION })}
      id={ID.PRESENTATION}
    >{ !started 
       ? <div className={cx('presentation', 'logo')} />
       : <div className={'presentation'}
          style={{
            position: 'absolute',
            width: 1280, // ADAPT
            height: 720,
          }}>
          <Tldraw />
        </div>
      }
      </div>
	);
}

const areEqual = () => true;

export default React.memo(withSize({ monitorHeight: true })(TldrawPresentationV2), areEqual);
