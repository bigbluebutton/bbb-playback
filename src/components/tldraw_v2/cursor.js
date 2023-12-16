import React from 'react';
import { useCurrentIndex } from 'components/utils/hooks';
import storage from 'utils/data/storage';
import './index.scss';

const getCursor = (index, size, cam) => {
  const inactive = {
    x: -1,
    y: -1,
  }

  if (index === -1 || cam?.x == null || cam?.y == null || cam?.z == null) return inactive;

  const currentData = storage.cursor[index];
  if (currentData.x === -1 && currentData.y === -1) return inactive;

  let _x = null;
  let _y = null;

  _x = (currentData.x + cam.x) * cam.z;
  _y = (currentData.y + cam.y) * cam.z;

  if (_x > size.width || _y > size.height ) return inactive;

  return {
    x: _x,
    y: _y
  };
};

const Cursor = ({ tldrawAPI, size }) => {
  const currentIndex = useCurrentIndex(storage.cursor);
  const { x, y } = getCursor(currentIndex, size, tldrawAPI?.getCamera());
  if (x === -1 || y === -1) return null;

  return (
    <div
      style={{
        zIndex: 1000,
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
