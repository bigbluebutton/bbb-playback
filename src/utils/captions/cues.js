// video.js tracks copy cues that are not its own VTTCue type, which would
// break replacing the text later; native tracks (Safari) need native cues
const createCue = (track, cue) => {
  const emulated = Array.isArray(track.cues_) && window.vttjs && window.vttjs.VTTCue;
  const Cue = emulated ? window.vttjs.VTTCue : window.VTTCue;

  return new Cue(cue.start, cue.end, cue.text);
};

// Placement settings carried over when a cue is made from others
const SETTINGS = ['align', 'line', 'position', 'size', 'vertical', 'snapToLines'];

// A cue placed like another one
const createCueLike = (track, cue, like) => {
  const created = createCue(track, cue);
  if (!like) return created;

  SETTINGS.forEach((setting) => {
    try {
      if (like[setting] !== undefined && like[setting] !== created[setting]) created[setting] = like[setting];
    } catch (error) {
      // A setting the cue type does not take
    }
  });

  return created;
};

const clearCues = (track) => {
  if (!track.cues) return;

  while (track.cues.length > 0) track.removeCue(track.cues[0]);
};

export {
  clearCues,
  createCue,
  createCueLike,
};
