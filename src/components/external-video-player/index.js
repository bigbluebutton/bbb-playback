import React from 'react';
import ReactPlayer from 'react-player';
import { defineMessages } from 'react-intl';
import useExternalVideoSync from './useExternalVideoSync';
import './styles.css';

const messages = defineMessages({
  autoPlayWarning: {
    id: 'player.externalVideo.autoPlayWarning',
    defaultMessage: 'If the video does not start, press play in the video.',
  },
  error: {
    id: 'player.externalVideo.error',
    defaultMessage: 'The external video could not be played (error: {code}).',
  },
});

const config = {
  youtube: { playerVars: { autoplay: 0, controls: 1, enablejsapi: 1, rel: 0 } },
  file: { attributes: { playsInline: true } },
};

export default function ExternalVideoPlayer({ videos, intl }) {
  const { video, playing, playbackRate, volume, muted, autoPlayBlocked, error,
    playerRef, notify } = useExternalVideoSync(videos);
  if (!video) return null;
  return (
    <div className="externalVideos-wrapper">
      {(autoPlayBlocked || error) && (
        <p className="autoPlayWarning" role="status">
          {error ? intl.formatMessage(messages.error, { code: error })
            : intl.formatMessage(messages.autoPlayWarning)}
        </p>
      )}
      <ReactPlayer
        key={`${video.timestamp}:${video.clear}:${video.url}`}
        ref={playerRef}
        url={video.url}
        config={config}
        controls
        playsinline
        volume={volume}
        muted={muted}
        playing={playing}
        playbackRate={playbackRate}
        onReady={() => notify('ready')}
        onPlay={() => notify('play')}
        onPause={() => notify('pause')}
        onEnded={() => notify('ended')}
        onBuffer={() => notify('buffer')}
        onBufferEnd={() => notify('bufferEnd')}
        onError={error => notify('error', error)}
        width="100%"
        height="100%"
      />
    </div>
  );
}
