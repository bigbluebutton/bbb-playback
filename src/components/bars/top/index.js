import React from 'react';
import PropTypes from 'prop-types';
import Title from './title';
import SearchButton from './buttons/search';
import SectionButton from './buttons/section';
import SwapButton from './buttons/swap';
import ThemeButton from './buttons/theme';
import { ID } from 'utils/constants';
import './index.scss';

const propTypes = {
  openModal: PropTypes.func,
  section: PropTypes.bool,
  toggleSection: PropTypes.func,
  toggleSwap: PropTypes.func,
};

const defaultProps = {
  openModal: () => {},
  section: false,
  toggleSection: () => {},
  toggleSwap: () => {},
};

const Top = ({
  openModal,
  section,
  toggleSection,
  toggleSwap,
}) => {

  return (
    <div className="top-bar">
      <div className="left">
        <SectionButton
          section={section}
          toggleSection={toggleSection}
        />
      </div>
      <div className="center">
        <Title openAbout={() => openModal(ID.ABOUT)} />
      </div>
      <div className="right">
        <ThemeButton />
        <SearchButton openSearch={() => openModal(ID.SEARCH)} />
        <SwapButton toggleSwap={toggleSwap} />
      </div>
    </div>
  );
};

Top.propTypes = propTypes;
Top.defaultProps = defaultProps;

// Checks the side section state
const areEqual = (prevProps, nextProps) => {
  return prevProps.section === nextProps.section;
};

export default React.memo(Top, areEqual);
