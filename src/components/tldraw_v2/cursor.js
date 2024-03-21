import storage from 'utils/data/storage';

const getCursor = (index) => {
  const inactive = {
    x: -1,
    y: -1,
  }

  if (index === -1) return inactive;

  const currentData = storage.cursor[index];
  if (currentData.x === -1 && currentData.y === -1) return inactive;

  return {
    x: currentData.x,
    y: currentData.y,
  };
};

export default getCursor;
