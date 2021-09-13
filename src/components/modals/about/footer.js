import React from 'react';
import { BUILD } from 'utils/constants';
import './index.scss';

const Footer = () => {
  return (
    <div className="about-footer">
      {BUILD ? (
        <span className="revision">
          {BUILD}
        </span>
      ) : (
        null
      )}
    </div>
  );
};

export default Footer;
