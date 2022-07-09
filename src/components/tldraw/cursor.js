import React from 'react';
import { useCurrentIndex } from 'components/utils/hooks';
import storage from 'utils/data/storage';
import './index.scss';

const getCursor = (index, size, pageState) => {
  const inactive = {
    x: -1,
    y: -1,
  }

  if (index === -1) return inactive;

  const currentData = storage.cursor[index];
  if (currentData.x === -1 && currentData.y === -1) return inactive;

  let _x = null;
  let _y = null;

  _x = (currentData.x + pageState?.camera?.point[0]) * pageState?.camera?.zoom;
  _y = (currentData.y + pageState?.camera?.point[1]) * pageState?.camera?.zoom;

  if (_x > size.width || _y > size.height ) return inactive;

  return {
    x: _x,
    y: _y
  };
};

const Cursor = ({ tldrawAPI, size }) => {
  const currentIndex = useCurrentIndex(storage.cursor);
  const { x, y } = getCursor(currentIndex, size, tldrawAPI?.getPageState());

  if (x === -1 || y === -1) return null;

  return (
    <div
      style={{
        zIndex: 2,
        position: "absolute",
        left: x - 5.0,
        top: y - 5.0,
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: "#C70039",
        pointerEvents: "none",
      }}
    />
  );
};

export default Cursor;
