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

export {
    getTldrawBbbVersion,
    getTldrawData,
};
