import { isBlank } from 'utils/captions/vtt';
import setupCaptionTranslation from './translation';
import {
  restoreCaptionLanguage,
  watchCaptionLanguage,
} from './preference';

const removeBlankCues = (track) => {
  const { cues } = track;
  if (!cues) return;

  for (let index = cues.length - 1; index >= 0; index--) {
    if (isBlank(cues[index].text)) track.removeCue(cues[index]);
  }
};

// Recordings' captions can have empty lines, which would show as an empty
// caption box; they go as soon as each track loads. Tracks come with the
// video source, after the player is ready
const cleanCaptionTracks = (videojsPlayer) => {
  const clean = (track) => {
    removeBlankCues(track);
    track.addEventListener('loadeddata', () => removeBlankCues(track));
  };

  const tracks = videojsPlayer.textTracks();
  for (let index = 0; index < tracks.length; index++) clean(tracks[index]);
  tracks.addEventListener('addtrack', (event) => clean(event.track));
};

// The CC menu: the recording's captions, the languages they can be
// translated into, and the viewer's language from the last visit
const setupCaptions = (videojsPlayer, options) => {
  cleanCaptionTracks(videojsPlayer);

  return setupCaptionTranslation(videojsPlayer, options).then(() => {
    if (videojsPlayer.isDisposed()) return;

    restoreCaptionLanguage(videojsPlayer);
    // Only from here on, so the restore itself is not taken for a choice
    watchCaptionLanguage(videojsPlayer);
  });
};

export default setupCaptions;
