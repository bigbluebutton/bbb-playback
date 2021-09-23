import React from 'react';
import { useCurrentIndex } from 'components/utils/hooks';
import storage from 'utils/data/storage';
import './index.scss';

const getCursor = (index, viewBox) => {
  const inactive = {
    x: -1,
    y: -1,
  }

  if (index === -1) return inactive;

  const currentData = storage.cursor[index];
  if (currentData.x === -1 && currentData.y === -1) return inactive;

  return {
    x: viewBox.x + (currentData.x * viewBox.width),
    y: viewBox.y + (currentData.y * viewBox.height),
  };
};

const Cursor = ({ viewBox }) => {
  const currentIndex = useCurrentIndex(storage.cursor);
  const { x, y } = getCursor(currentIndex, viewBox);

  if (x === -1 || y === -1) return null;

  return (
    <circle
      className="cursor"
      style={{ cx: x, cy: y }}
    />
  );
};

export default Cursor;
