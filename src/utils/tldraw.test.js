import { getTldrawImageFilePath } from './tldraw';

const validShape = {
  type: 'image',
  meta: {
    bbbImageSrc: '/presentation/986a45d2a620695c3a0bdca939a8ad4ca6a9e2b9-1785814812863/uploads/44c71706-8566-4c79-a303-79f6862affb0.png',
  },
  props: {
    assetId: 'asset:9bXh_4Vm-2',
  },
};

it('gets the uploaded file path from a valid image shape', () => {
  expect(getTldrawImageFilePath(validShape))
    .toEqual('uploads/44c71706-8566-4c79-a303-79f6862affb0.png');
});

it('rejects a non-image shape', () => {
  expect(getTldrawImageFilePath({ ...validShape, type: 'geo' })).toBeNull();
});

it('rejects an image shape without a source', () => {
  expect(getTldrawImageFilePath({ ...validShape, meta: {} })).toBeNull();
});

it('rejects a source outside the uploaded image path', () => {
  const shape = {
    ...validShape,
    meta: { bbbImageSrc: 'https://example.com/image.png' },
  };

  expect(getTldrawImageFilePath(shape)).toBeNull();
});

it('rejects a malformed asset id', () => {
  const shape = {
    ...validShape,
    props: { assetId: 'asset:invalid/id' },
  };

  expect(getTldrawImageFilePath(shape)).toBeNull();
});
