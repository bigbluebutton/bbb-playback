// Event positions must be genuine media positions (BBB fix for #24050).
// Old recordings with incorrect positions are not heuristically repaired.
const getStartPosition = (url) => {
  try {
    const parsed = new URL(url);
    const fragment = new URLSearchParams(parsed.hash.slice(1));
    const value = parsed.searchParams.get('t') ?? parsed.searchParams.get('start')
      ?? fragment.get('t');
    if (!value) return 0;
    if (/^\d+(?:\.\d+)?$/.test(value)) return Number(value);
    const parts = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?$/.exec(value);
    return parts ? Number(parts[1] || 0) * 3600 + Number(parts[2] || 0) * 60
      + Number(parts[3] || 0) : 0;
  } catch {
    return 0;
  }
};

export const getVideoState = (videos = [], recordingTime) => {
  const video = videos.find(item => item.timestamp <= recordingTime && recordingTime < item.clear);
  if (!video) return null;

  let position = getStartPosition(video.url);
  let rate = 1;
  let anchor = video.timestamp;
  let playing = true; // BBB 3.x may omit the initial play event.
  let eventIndex = -1;
  (video.events || []).forEach((event, index) => {
    if (event.timestamp > recordingTime) return;
    if (!['start', 'play', 'stop', 'pause', 'seek', 'playerUpdate', 'presenterReady',
      'setPlaybackRate', 'playbackRateChange'].includes(event.type)) return;
    position += playing ? (event.timestamp - anchor) * rate : 0;
    const eventPosition = Number.parseFloat(event.time);
    if (Number.isFinite(eventPosition)) position = eventPosition;
    anchor = event.timestamp;
    const eventRate = Number.parseFloat(event.rate);
    if (Number.isFinite(eventRate) && eventRate > 0) rate = eventRate;
    if (event.type === 'play' || event.type === 'start') playing = true;
    else if (event.type === 'stop' || event.type === 'pause') playing = false;
    else if (typeof event.playing === 'boolean') playing = event.playing;
    eventIndex = index;
  });

  return {
    video,
    eventIndex,
    rate,
    position: Math.max(0, position + (playing ? (recordingTime - anchor) * rate : 0)),
    playing,
  };
};
