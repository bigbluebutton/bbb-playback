import { getLanguage } from 'utils/captions/translators';
import {
  getCaptionPreference,
  saveCaptionPreference,
} from 'utils/preferences';

const isCaptions = (track) => track.kind === 'captions' || track.kind === 'subtitles';

const getCaptionTracks = (videojsPlayer) => {
  const tracks = videojsPlayer.textTracks();
  const result = [];
  for (let index = 0; index < tracks.length; index++) {
    if (isCaptions(tracks[index])) result.push(tracks[index]);
  }

  return result;
};

// Turns on the caption language picked on an earlier visit, original or
// translated, when this recording offers it
const restoreCaptionLanguage = (videojsPlayer) => {
  const preference = getCaptionPreference();
  if (!preference || preference === 'off') return;

  const tracks = getCaptionTracks(videojsPlayer);
  if (tracks.some(track => track.mode === 'showing')) return;

  // The recording's own captions win over a translation of them
  const matches = tracks.filter(track => getLanguage(track.language) === preference);
  const track = matches.find(match => match.kind === 'captions') || matches[0];
  if (track) track.mode = 'showing';
};

// Remembers the language picked in the CC menu, or that captions were off
const watchCaptionLanguage = (videojsPlayer) => {
  const handleChange = () => {
    const showing = getCaptionTracks(videojsPlayer).find(track => track.mode === 'showing');
    saveCaptionPreference(showing ? getLanguage(showing.language) : 'off');
  };

  const tracks = videojsPlayer.textTracks();
  tracks.addEventListener('change', handleChange);
  videojsPlayer.on('dispose', () => tracks.removeEventListener('change', handleChange));
};

export {
  restoreCaptionLanguage,
  watchCaptionLanguage,
};
