import React from 'react';
import cx from 'classnames';
import Thumbnails from 'components/thumbnails';
import './index.scss';

const Bottom = ({
  fullscreen,
  handleSearch,
  search,
}) => {

  return (
    <div className={cx('bottom-content', { 'inactive': fullscreen })}>
      <Thumbnails
        handleSearch={handleSearch}
        interactive
        search={search}
      />
    </div>
  );
};

export default Bottom;
