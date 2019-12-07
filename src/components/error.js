import React from 'react';

export default function Error(props) {
  const { code } = props;

  return (
    <div>
      Error {code}
    </div>
  );
}
