import React from 'react';
import Item from './body/item';
import {
  BUILD,
  ID,
} from 'utils/data';
import './index.scss';

const Footer = () => {
  return (
    <div className="about-footer">
      {BUILD ? <Item icon={ID.SETTINGS} value={BUILD} /> : null}
    </div>
  );
};

export default Footer;
