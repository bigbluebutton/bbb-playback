import React from 'react';
import cx from 'classnames';
import Thumbnails from 'components/thumbnails';
import { search as config } from 'config';
import './index.scss';

const Body = ({ handleOnChange, metadata, search, thumbnails, }) => {

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
          interactive={false}
          player={null}
          recordId={metadata.id}
          search={search}
          thumbnails={thumbnails}
        />
      </div>
    </div>
  );
};

export default Body;
