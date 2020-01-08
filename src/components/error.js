import React from 'react';
import './index.scss';

export default function Error(props) {
  const { code } = props;

  return (
    <div
      aria-label="error"
      className="error-wrapper"
      id="error"
    >
      <div className="error-code">
        {code}
      </div>
    </div>
  );
}
