import React from 'react';
import './index.scss';

export default function Error(props) {
  const { code } = props;

  const id = 'error';

  return (
    <div
      aria-label="error"
      className="error-wrapper"
      id={id}
    >
      <div className="error-code">
        {code}
      </div>
    </div>
  );
}
