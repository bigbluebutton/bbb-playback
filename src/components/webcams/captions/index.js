import setupCaptionTranslation from './translation';
import {
  restoreCaptionLanguage,
  watchCaptionLanguage,
} from './preference';

// The CC menu: the recording's captions, the languages they can be
// translated into, and the viewer's language from the last visit
const setupCaptions = (videojsPlayer, options) => {
  return setupCaptionTranslation(videojsPlayer, options).then(() => {
    if (videojsPlayer.isDisposed()) return;

    restoreCaptionLanguage(videojsPlayer);
    // Only from here on, so the restore itself is not taken for a choice
    watchCaptionLanguage(videojsPlayer);
  });
};

export default setupCaptions;
