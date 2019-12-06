import React from 'react';

export default function Message(props) {
  return (
    <span>
      {props.name} {props.message}
    </span>
  );
}