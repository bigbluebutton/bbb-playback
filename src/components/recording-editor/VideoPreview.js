import React, { useEffect, useRef, useState } from 'react';

import { useEditorI18n } from './i18n';

export default function VideoPreview({ clip, time, playing, rate }) {
  const { t } = useEditorI18n();
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
  if (!clip) return <div className="re-placeholder">{t('noVideo')}</div>;
  return <div className="re-video">
    <video ref={ref} key={clip.url} src={clip.url} muted playsInline preload="auto" onError={() => setError(true)} />
    <span>{clip.kind === 'deskshare' ? t('screen') : clip.user || t('camera')}</span>
    {error && <p className="re-render-warning">{t('videoError', { file: clip.relative })}</p>}
  </div>;
}
