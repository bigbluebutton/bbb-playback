import React from 'react';
import {
  defineMessages,
  FormattedDate,
} from 'react-intl';
import cx from 'classnames';
import { controls as config } from 'config';
import Button from 'components/utils/button';
import { ID } from 'utils/data';
import './index.scss';

const intlMessages = defineMessages({
  about: {
    id: 'button.about.aria',
    description: 'Aria label for the about button',
  },
  section: {
    id: 'button.section.aria',
    description: 'Aria label for the section button',
  },
  search: {
    id: 'button.search.aria',
    description: 'Aria label for the search button',
  },
  swap: {
    id: 'button.swap.aria',
    description: 'Aria label for the swap button',
  },
});

const SearchButton = ({ intl, enabled, toggleSearch }) => {
  if (!enabled) return null;

  return (
    <Button
      aria={intl.formatMessage(intlMessages.search)}
      circle
      handleOnClick={toggleSearch}
      icon={ID.SEARCH}
    />
  );
};

const SectionButton = ({ intl, enabled, section, toggleSection }) => {
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

const SwapButton = ({ intl, enabled, toggleSwap }) => {
  if (!enabled) return null;

  return (
    <Button
      aria={intl.formatMessage(intlMessages.swap)}
      circle
      handleOnClick={toggleSwap}
      icon={ID.SWAP}
    />
  );
};

const Title = ({ interactive, intl, name, start, toggleAbout }) => {
  const date = <FormattedDate value={new Date(start)} />;

  if (!interactive) {

    return (
      <span className="title">
        {name} - {date}
      </span>
    );
  }

  return (
    <span
      aria={intl.formatMessage(intlMessages.about)}
      className={cx('title', { interactive })}
      onClick={toggleAbout}
      onKeyPress={(e) => e.key === 'Enter' ? toggleAbout() : null}
      tabIndex="0"
    >
      {name} - {date}
    </span>
  );
}

const TopBar = (props) => {
  const {
    control,
    intl,
    single,
  } = props;

  const {
    about,
    search,
    section,
    swap,
  } = config;

  return (
    <div className="top-bar">
      <div className="left">
        <SectionButton
          intl={intl}
          enabled={control && section}
          section={props.section}
          toggleSection={props.toggleSection}
        />
      </div>
      <div className="center">
        <Title
          interactive={control && about}
          intl={intl}
          name={props.name}
          start={props.start}
          toggleAbout={props.toggleAbout}
        />
      </div>
      <div className="right">
        <SearchButton
          intl={intl}
          enabled={control && search && !single}
          toggleSearch={props.toggleSearch}
        />
        <SwapButton
          intl={intl}
          enabled={control && swap && !single}
          toggleSwap={props.toggleSwap}
        />
      </div>
    </div>
  );
};

export default TopBar;
