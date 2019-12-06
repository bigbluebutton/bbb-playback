import React from 'react';

export default function Error(props) {
  const code = props.code ? props.code : 404;

  return (
    <div>
      Error {code}
    </div>
  );
}