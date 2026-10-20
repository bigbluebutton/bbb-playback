import React from 'react';
import cx from 'classnames';
import {
  defineMessages,
  useIntl,
} from 'react-intl';
import Bottom from 'components/player/bottom';
import Icon from 'components/utils/icon';
import { ID } from 'utils/constants';
import './index.scss';

const intlMessages = defineMessages({
  label: {
    id: 'player.minimized.label',
    description: 'Label shown while the presentation is minimized',
  },
  description: {
    id: 'player.minimized.description',
    description: 'Tooltip explaining that the presentation is minimized',
  },
  slides: {
    id: 'player.minimized.slides',
    description: 'Label for the button that shows or hides the slides',
  },
});

const DESCRIPTION = 'minimized-description';

const Minimized = ({
  handleSearch,
  open,
  search,
  toggleOpen,
}) => {
  const intl = useIntl();

  return (
    <div className="minimized">
      <button
        aria-describedby={DESCRIPTION}
        aria-expanded={open}
        className="minimized-bar"
        onClick={() => toggleOpen()}
      >
        <span className="minimized-label">
          <span aria-hidden="true">
            <Icon name={ID.PRESENTATION} />
          </span>
          {intl.formatMessage(intlMessages.label)}
        </span>
        <span className="minimized-toggle">
          <span className="minimized-toggle-text">
            {intl.formatMessage(intlMessages.slides)}
          </span>
          <span
            aria-hidden="true"
            className={cx('minimized-chevron', { open })}
          >
            <Icon name="right" />
          </span>
        </span>
      </button>
      <div
        className="minimized-tooltip"
        id={DESCRIPTION}
        role="tooltip"
      >
        {intl.formatMessage(intlMessages.description)}
      </div>
      {open ? (
        <Bottom
          handleSearch={handleSearch}
          search={search}
        />
      ) : null}
    </div>
  );
};

export default Minimized;
