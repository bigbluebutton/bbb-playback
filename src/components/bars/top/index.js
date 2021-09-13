import React from 'react';
import PropTypes from 'prop-types';
import Title from './title';
import SearchButton from './buttons/search';
import SectionButton from './buttons/section';
import SwapButton from './buttons/swap';
import { controls as config } from 'config';
import layout from 'utils/layout';
import './index.scss';

const propTypes = {
  control: PropTypes.bool,
  section: PropTypes.bool,
  toggleAbout: PropTypes.func,
  toggleSearch: PropTypes.func,
  toggleSection: PropTypes.func,
  toggleSwap: PropTypes.func,
};

const defaultProps = {
  control: false,
  section: false,
  toggleAbout: () => {},
  toggleSearch: () => {},
  toggleSection: () => {},
  toggleSwap: () => {},
};

const Top = ({
  control,
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
          enabled={control && config.section}
          section={section}
          toggleSection={toggleSection}
        />
      </div>
      <div className="center">
        <Title
          interactive={control && config.about}
          toggleAbout={toggleAbout}
        />
      </div>
      <div className="right">
        <SearchButton
          enabled={control && config.search && !layout.single}
          toggleSearch={toggleSearch}
        />
        <SwapButton
          enabled={control && config.swap && !layout.single}
          toggleSwap={toggleSwap}
        />
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
