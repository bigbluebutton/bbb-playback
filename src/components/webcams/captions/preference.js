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
// translated, when this recording offers it. With no earlier choice, the
// recording's own captions come on: in the viewer's language when there are
// some, otherwise the first ones. A choice of no captions is kept
const restoreCaptionLanguage = (videojsPlayer, locale = '') => {
  const preference = getCaptionPreference();
  if (preference === 'off') return;

  const tracks = getCaptionTracks(videojsPlayer);
  if (tracks.some(track => track.mode === 'showing')) return;

  // The recording's own captions win over a translation of them
  const own = tracks.filter(track => track.kind === 'captions');
  let track;
  if (preference) {
    const matches = tracks.filter(entry => getLanguage(entry.language) === preference);
    track = matches.find(match => match.kind === 'captions') || matches[0];
  } else {
    const viewer = getLanguage(locale);
    track = own.find(entry => getLanguage(entry.language) === viewer) || own[0];
  }
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
