import React from 'react';
import PropTypes from 'prop-types';
import Progress from './progress';
import Status from './status';
import Title from './title';
import BookmarkButton from './buttons/bookmark';
import MoreButton from './buttons/more';
import SearchButton from './buttons/search';
import SectionButton from './buttons/section';
import useShareItem from './buttons/share';
import useSwapItem from './buttons/swap';
import ThemeButton from './buttons/theme';
import { ID } from 'utils/constants';
import './index.scss';

const propTypes = {
  openModal: PropTypes.func,
  section: PropTypes.bool,
  toggleSection: PropTypes.func,
  toggleSwap: PropTypes.func,
  hidePresentation: PropTypes.bool,
};

const defaultProps = {
  openModal: () => { },
  section: false,
  toggleSection: () => { },
  toggleSwap: () => { },
};

const Top = ({
  openModal,
  section,
  toggleSection,
  toggleSwap,
  hidePresentation,
}) => {
  // Less used actions, named, in the More menu
  const shareItem = useShareItem();
  const swapItem = useSwapItem({ toggleSwap, hidePresentation });
  const moreItems = [shareItem, swapItem].filter(Boolean);

  return (
    <header className="top-bar">
      <div className="start">
        <SectionButton
          section={section}
          toggleSection={toggleSection}
        />
        <Title openAbout={() => openModal(ID.ABOUT)} />
      </div>
      <div className="end">
        <Status />
        <Progress />
        <BookmarkButton />
        <SearchButton openSearch={() => openModal(ID.SEARCH)} />
        <ThemeButton />
        <MoreButton items={moreItems} />
      </div>
    </header>
  );
};

Top.propTypes = propTypes;
Top.defaultProps = defaultProps;

// Checks the side section state
const areEqual = (prevProps, nextProps) => {
  if (prevProps.hidePresentation !== nextProps.hidePresentation) return false;
  return prevProps.section === nextProps.section;
};

export default React.memo(Top, areEqual);
