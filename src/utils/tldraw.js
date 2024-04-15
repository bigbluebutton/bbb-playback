import storage from 'utils/data/storage';

/**
 * Retrieves the BBB version for a specific Tldraw instance from storage.
 *
 * @param {number} index - The index of the Tldraw instance in the storage.
 * @returns {(string|undefined)} The BBB version associated with the Tldraw instance at the specified index. 
 *                               Returns undefined if no instance is found at the index.
 */
const getTldrawBbbVersion = (index) => storage.tldraw[index]?.bbb_version;

/**
 * Retrieves Tldraw data for a given slide index and page number.
 * 
 * This function checks if the Tldraw instance at the specified slide index has an ID matching the provided page number.
 * If there's a match, it returns the data associated with that Tldraw instance. Otherwise, it returns an empty array.
 *
 * @param {number} index - The index of the current slide in the Tldraw storage.
 * @param {number} pageNumber - The page number to match against the Tldraw instance's ID.
 * @returns {Array|Object} The data associated with the Tldraw instance if the page number matches the instance's ID, 
 *                         or an empty array if there's no match or the instance is not found.
 */
const getTldrawData = (index, pageNumber) => storage.tldraw[index].id === pageNumber.toString()
  ? storage.tldraw[index].data : [];

/**
 * Calculates and returns the viewBox dimensions for the presentation based on the panzoom index and a scaling ratio.
 * The function assumes that there is a `storage.panzooms` array containing the panzoom data for each element.
 * 
 * @param {number} index - The index of the element in the `storage.panzooms` array.
 * @param {number} scaleRatio - The ratio by which to scale the width and height of the viewBox.
 * @returns {Object} An object representing the viewBox dimensions with properties `height`, `x`, 
 *                   `width`, and `y`. Each property is a number. If `index` is -1, all properties 
 *                   are set to 0.
 */
const getViewBox = (index, scaleRatio) => {
  const inactive = {
    height: 0,
    x: 0,
    width: 0,
    y: 0,
  };

  if (index === -1) return inactive;

  const currentData = storage.panzooms[index];
  const scaledViewBoxWidth = currentData.width * scaleRatio;
  const scaledViewBoxHeight = currentData.height * scaleRatio;

  return {
    height: scaledViewBoxHeight,
    x: currentData.x,
    width: scaledViewBoxWidth,
    y: currentData.y,
  };
};

/**
 * Creates an image asset object for use in a Tldraw v2 presentation. This function initializes an image asset with
 * specified dimensions and a source URL. The asset is identified by a unique assetId and is configured with default
 * properties for a Tldraw image asset.
 * 
 * @param {string|TLAssetId} assetId - The unique AssetRecordType identifier for the new image asset.
 * @param {string} imageUrl - The URL of the image to be used as the source for the asset.
 * @param {number} scaledWidth - The width of the image asset after scaling.
 * @param {number} scaledHeight - The height of the image asset after scaling.
 * @returns {Object} An object representing the image asset.
 */
const createTldrawImageAsset = (assetId, imageUrl, scaledWidth, scaledHeight) => {
  return {
    id: assetId,
    typeName: "asset",
    type: "image",
    meta: {},
    props: {
      w: scaledWidth,
      h: scaledHeight,
      src: imageUrl,
      name: "",
      isAnimated: false,
      mimeType: null,
    }
  };
}

/**
 * Creates a background shape object for a Tldraw presentation page. The function generates a shape object 
 * with predefined properties suitable for a background image. It takes the asset ID of the image, the current page ID, 
 * and scaled dimensions to create the shape.
 * 
 * @param {string|TLAssetId} assetId - The unique identifier for the new image asset.
 * @param {string} curPageId - The unique identifier of the current page where this background shape will be added.
 * @param {number} scaledWidth - The width of the background shape after scaling. Defaults to 1 if not provided.
 * @param {number} scaledHeight - The height of the background shape after scaling. Defaults to 1 if not provided.
 * @returns {Object} An object representing the background shape.
 */

const createTldrawBackgroundShape = (assetId, curPageId, scaledWidth, scaledHeight) => {
  return {
    x: 1,
    y: 1, 
    rotation: 0,
    isLocked: true,
    opacity: 1,
    meta: {},
    id: `shape:BG-${curPageId}`,
    type: "image",
    props: {
      w: scaledWidth || 1,
      h: scaledHeight || 1,
      assetId: assetId,
      playing: true,
      url: "",
      crop: null,
    },
    parentId: `page:${curPageId}`,
    index: 'a0',
    typeName: 'shape'
  };
}

/**
 * Creates a Tldraw shape object representing the cursor.
 *
 * @param {number} x - The x-coordinate of the cursor shape.
 * @param {number} y - The y-coordinate of the cursor shape.
 * @param {string} curPageId - The current page ID of the slide the cursor is rendering on.
 * @returns {object} A Tldraw cursor shape object.
 *
 */
const createTldrawCursorShape = (x, y, curPageId) => {
  return {
    x,
    y,
    rotation: 0,
    isLocked: false,
    opacity: 1,
    meta: {},
    id: "shape:cursor",
    type: "geo",
    props: {
      w: 2.5,
      h: 2.5,
      geo: "ellipse",
      color: "red",
      labelColor: "black",
      fill: "solid",
      dash: "draw",
      size: "xl",
      font: "draw",
      text: "",
      align: "middle",
      verticalAlign: "middle",
      growY: 0,
      url: ""
    },
    parentId: `page:${curPageId}`,
    index: "z9",
    typeName: "shape"
  }
}

export {
  getTldrawBbbVersion,
  getTldrawData,
  getViewBox,
  createTldrawImageAsset,
  createTldrawBackgroundShape,
  createTldrawCursorShape,
};
