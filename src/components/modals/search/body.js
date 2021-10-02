import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Thumbnails from 'components/thumbnails';
import { search as config } from 'config';
import './index.scss';

const propTypes = {
  handleOnChange: PropTypes.func,
  search: PropTypes.array,
};

const defaultProps = {
  handleOnChange: () => {},
  search: [],
};

const Body = ({
  handleOnChange,
  search,
}) => {

  return (
    <div className="search-body">
      <input
        maxLength={config.length.max}
        minLength={config.length.min}
        onChange={(event) => handleOnChange(event)}
        type="text"
      />
      <div className={cx('result', { active: true })}>
        <Thumbnails
          currentDataIndex={0}
          handleSearch={null}
          player={null}
          search={search}
        />
      </div>
    </div>
  );
};

Body.propTypes = propTypes;
Body.defaultProps = defaultProps;

export default Body;
