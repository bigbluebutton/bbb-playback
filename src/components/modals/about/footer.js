import React from 'react';
import Item from './item';
import {
  BUILD,
  ID,
} from 'utils/constants';
import './index.scss';

const Footer = () => {
  return (
    <div className="about-footer">
      {BUILD ? (
        <Item
          icon={ID.SETTINGS}
          value={BUILD}
        />
      ) : (
        null
      )}
    </div>
  );
};

export default Footer;
