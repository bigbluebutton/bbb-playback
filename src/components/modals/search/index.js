import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Body from './body';
import Footer from './footer';
import Header from './header';
import { search as config } from 'config';
import Modal from 'components/utils/modal';
import { search as getSearch } from 'utils/actions';
import {
  isEmpty,
  isEqual,
} from 'utils/data/validators';
import './index.scss';

const getValue = (event) => {
  if (event && event.target) return event.target.value;

  return null;
};

const isValid = (value) => {
  if (value && typeof value === 'string') {
    return value.length >= config.length.min;
  }

  return false;
};

const propTypes = {
  handleSearch: PropTypes.func,
  metadata: PropTypes.object,
  thumbnails: PropTypes.array,
  toggleModal: PropTypes.func,
};

const defaultProps = {
  handleSearch: () => {},
  metadata: {},
  thumbnails: [],
  toggleModal: () => {},
};

const Search = ({
  handleSearch,
  metadata,
  thumbnails,
  toggleModal,
}) => {
  const [disabled, setDisabled] = useState(true);
  const [search, setSearch] = useState([]);

  const handleOnChange = (event) => {
    const value = getValue(event);
    if (isValid(value)) {
      const result = getSearch(value, thumbnails);

      // If different, update search
      if (!isEqual(search, result)) {
        setSearch(result);
      }

      // Check to enable
      if (disabled) setDisabled(false);
    } else {
      // If not empty, clear search
      if (!isEmpty(search)) {
        setSearch([]);
      }

      // Chack to disable
      if (!disabled) setDisabled(true);
    }
  };

  const handleOnClick = () => {
    handleSearch(search);
    toggleModal();
  };

  return (
    <Modal onClose={toggleModal}>
      <Header />
      <Body
        handleOnChange={(event) => handleOnChange(event)}
        metadata={metadata}
        search={search}
        thumbnails={thumbnails}
      />
      <Footer
        disabled={disabled}
        handleOnClick={() => handleOnClick()}
      />
    </Modal>
  );
};

Search.propTypes = propTypes;
Search.defaultProps = defaultProps;

// Avoid re-render
const areEqual = () => true;

export default React.memo(Search, areEqual);
