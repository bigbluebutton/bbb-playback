import { createCueLike } from 'utils/captions/cues';
import { reflowCues } from 'utils/captions/reflow';
import {
  isBlank,
  tidyText,
} from 'utils/captions/vtt';
import setupCaptionTranslation from './translation';
import {
  restoreCaptionLanguage,
  watchCaptionLanguage,
} from './preference';

const tidyCues = (track) => {
  const { cues } = track;
  if (!cues) return;

  for (let index = cues.length - 1; index >= 0; index--) {
    const cue = cues[index];
    if (isBlank(cue.text)) {
      track.removeCue(cue);
    } else {
      const text = tidyText(cue.text);
      if (text !== cue.text) cue.text = text;
    }
  }
};

// Captions typed or transcribed live are recorded a word or two per cue,
// which shows word by word: such cues are regrouped into sentences, each
// placed like the first cue it was made from. Returns whether cues changed
const reflowTrack = (track) => {
  const { cues } = track;
  if (!cues || cues.length === 0) return false;

  const source = [];
  for (let index = 0; index < cues.length; index++) {
    const cue = cues[index];
    source.push({
      cue,
      end: cue.endTime,
      start: cue.startTime,
      text: cue.text,
    });
  }

  const merged = reflowCues(source);
  if (merged === source) return false;

  for (let index = cues.length - 1; index >= 0; index--) track.removeCue(cues[index]);
  merged.forEach(line => track.addCue(createCueLike(track, line, line.cues[0].cue)));

  return true;
};

// Recordings' captions can have empty lines, which would show as an empty
// caption box or a sliver of one next to the text; they go as soon as each
// track loads, and word-level cues become sentences. Tracks come with the
// video source, after the player is ready
const cleanCaptionTracks = (videojsPlayer) => {
  const clean = (track) => {
    tidyCues(track);
    if (reflowTrack(track) && track.mode === 'showing') {
      // Paused players do not redraw captions until the next time update
      const display = videojsPlayer.getChild('textTrackDisplay');
      if (display && typeof display.updateDisplay === 'function') display.updateDisplay();
    }
  };

  const watch = (track) => {
    clean(track);
    track.addEventListener('loadeddata', () => clean(track));
  };

  const tracks = videojsPlayer.textTracks();
  for (let index = 0; index < tracks.length; index++) watch(tracks[index]);
  tracks.addEventListener('addtrack', (event) => watch(event.track));
};

// The CC menu: the recording's captions, the languages they can be
// translated into, and the viewer's language from the last visit
const setupCaptions = (videojsPlayer, options) => {
  cleanCaptionTracks(videojsPlayer);

  return setupCaptionTranslation(videojsPlayer, options).then(() => {
    if (videojsPlayer.isDisposed()) return;

    restoreCaptionLanguage(videojsPlayer, options.locale);
    // Only from here on, so the restore itself is not taken for a choice
    watchCaptionLanguage(videojsPlayer);
  });
};

export default setupCaptions;
