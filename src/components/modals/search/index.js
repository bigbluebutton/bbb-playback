import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Body from './body';
import Footer from './footer';
import Header from './header';
import { search as config } from 'config';
import Modal from 'components/utils/modal';
import { search as getSearch } from 'utils/actions';
import storage from 'utils/data/storage';
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
  handleClose: PropTypes.func,
  handleSearch: PropTypes.func,
};

const defaultProps = {
  handleClose: () => {},
  handleSearch: () => {},
};

const Search = ({
  handleClose,
  handleSearch,
}) => {
  const [disabled, setDisabled] = useState(true);
  const [search, setSearch] = useState([]);

  const handleOnChange = (event) => {
    const value = getValue(event);
    if (isValid(value)) {
      const result = getSearch(value, storage.thumbnails);

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
    handleClose();
  };

  return (
    <Modal onClose={handleClose}>
      <Header />
      <Body
        handleOnChange={(event) => handleOnChange(event)}
        search={search}
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
