import React from 'react';
import PropTypes from 'prop-types';
import Title from './title';
import SearchButton from './buttons/search';
import SectionButton from './buttons/section';
import SwapButton from './buttons/swap';
import './index.scss';

const propTypes = {
  section: PropTypes.bool,
  toggleAbout: PropTypes.func,
  toggleSearch: PropTypes.func,
  toggleSection: PropTypes.func,
  toggleSwap: PropTypes.func,
};

const defaultProps = {
  section: false,
  toggleAbout: () => {},
  toggleSearch: () => {},
  toggleSection: () => {},
  toggleSwap: () => {},
};

const Top = ({
  section,
  toggleAbout,
  toggleSearch,
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
        <Title toggleAbout={toggleAbout} />
      </div>
      <div className="right">
        <SearchButton toggleSearch={toggleSearch} />
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
