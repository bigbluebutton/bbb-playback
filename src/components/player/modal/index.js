import React from 'react';
import AboutModal from 'components/modals/about';
import SearchModal from 'components/modals/search';
import { ID } from 'utils/constants';

const Modal = ({
  handleSearch,
  modal,
  toggleModal,
}) => {
  const open = modal.length > 0;

  if (!open) return null;

  switch (modal) {
    case ID.ABOUT:
      return (
        <AboutModal toggleModal={() => toggleModal(ID.ABOUT)} />
      );
    case ID.SEARCH:
      return (
        <SearchModal
          handleSearch={handleSearch}
          toggleModal={() => toggleModal(ID.SEARCH)}
        />
      );
    default:
      return null;
  }
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.modal !== nextProps.modal) return false;

  return true;
};

export default React.memo(Modal, areEqual);
