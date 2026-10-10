import React, { useEffect, useRef, useState } from 'react';

export default function VideoPreview({ clip, time, playing, rate }) {
  const ref = useRef(null);
  const [error, setError] = useState(false);
  useEffect(() => { setError(false); }, [clip?.url]);
  useEffect(() => {
    const video = ref.current;
    if (!video || !clip) return;
    const position = Math.max(0, (time - clip.start_ms) / 1000);
    if (Math.abs(video.currentTime - position) > 0.2) video.currentTime = position;
    video.playbackRate = rate;
    if (playing) video.play().catch(() => {});
    else video.pause();
  }, [clip, time, playing, rate]);
  if (!clip) return <div className="re-placeholder">映像なし</div>;
  return <div className="re-video">
    <video ref={ref} key={clip.url} src={clip.url} muted playsInline preload="auto" onError={() => setError(true)} />
    <span>{clip.kind === 'deskshare' ? '画面共有' : clip.user || 'カメラ'}</span>
    {error && <p className="re-render-warning">ブラウザでこの映像を再生できません（{clip.relative}）。</p>}
  </div>;
}
