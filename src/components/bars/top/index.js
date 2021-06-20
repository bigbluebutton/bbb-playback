import React from 'react';
import Title from './title';
import SearchButton from './buttons/search';
import SectionButton from './buttons/section';
import SwapButton from './buttons/swap';
import { controls as config } from 'config';
import './index.scss';

const Top = (props) => {
  const {
    control,
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
          enabled={control && section}
          section={props.section}
          toggleSection={props.toggleSection}
        />
      </div>
      <div className="center">
        <Title
          interactive={control && about}
          name={props.name}
          start={props.start}
          toggleAbout={props.toggleAbout}
        />
      </div>
      <div className="right">
        <SearchButton
          enabled={control && search && !single}
          toggleSearch={props.toggleSearch}
        />
        <SwapButton
          enabled={control && swap && !single}
          toggleSwap={props.toggleSwap}
        />
      </div>
    </div>
  );
};

// Checks the side section state
const areEqual = (prevProps, nextProps) => {
  return prevProps.section === nextProps.section;
};

export default React.memo(Top, areEqual);
