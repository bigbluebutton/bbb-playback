import React from 'react';
import './index.scss';

export default function Error(props) {
  const { code } = props;

  return (
    <div className="error-wrapper">
      Error {code}
    </div>
  );
}
