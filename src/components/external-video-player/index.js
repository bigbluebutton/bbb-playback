import React, { Component } from 'react';
import ReactPlayer from 'react-player';
import cx from 'classnames';
import { defineMessages } from 'react-intl';
import logger from 'utils/logger';
import { ID } from 'utils/constants';
import { getCurrentDataIndex } from 'utils/data';

import './styles.css';


const intlMessages = defineMessages({
  autoPlayWarning: {
    id: 'player.externalVideo.autoPlayWarning',
    description: 'Shown when user needs to interact with player to make it work',
  },
 
});


const SYNC_INTERVAL_SECOND = 5;
const AUTO_PLAY_BLOCK_DETECTION_TIMEOUT_SECONDS = 5;
const ORCHESTRATOR_INTERVAL_MILLISECOND = 500;

class ExternalVideoPlayer extends Component {
  
  constructor(props) {
    super(props);

    this.player = null;

    this.autoPlayTimeout = null;

    this.hasPlayedBefore = false;
    this.playerIsReady = false;

    this.time = 0;
    this.buffering= false;
    this.lastTime = 0;
    this.playerUpdateTime = -1;
    this.primaryPlayerPlaying = false;
    this.lastEventPlaybackRate = 1;
    
    this.state = {
      muted: false,
      playing: false,
      autoPlayBlocked: false,
      errorPlaying: false,
      playbackRate: 1,
      volume: 1,
    };

    this.opts = {
      // default option for all players, can be overwritten
      playerOptions: {
        autoplay: false,
        playsinline: true,
        controls: false,
      },
      file: {
        attributes: {
          controls: false,
          autoPlay: false,
          playsInline: true,
        },
      },
      youtube: {
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          autohide: 1,
          rel: 0,
          ecver: 2,
          controls: 0,
          enablejsapi: 0,
          showinfo: 0
        },
      },
    
     preload: true,
    };


    this.getCurrentTime = this.getCurrentTime.bind(this);
    this.setPlaybackRate = this.setPlaybackRate.bind(this);
    this.seekTo = this.seekTo.bind(this);

    this.handleFirstPlay = this.handleFirstPlay.bind(this);
    this.handleOnReady = this.handleOnReady.bind(this);
    this.handleOnPlay = this.handleOnPlay.bind(this);
    this.handleOnPause = this.handleOnPause.bind(this);
    this.handleVolumeChange = this.handleVolumeChange.bind(this);
    this.handleOnBuffer = this.handleOnBuffer.bind(this);
    this.handleOnBufferEnd = this.handleOnBufferEnd.bind(this);
        
    this.orchestrator = this.orchestrator.bind(this);
    this.autoPlayBlockDetected = this.autoPlayBlockDetected.bind(this);
   
  }

  autoPlayBlockDetected() {
    this.setState({ autoPlayBlocked: true });
  }

  handleFirstPlay() {
    const { hasPlayedBefore } = this;

    if (!hasPlayedBefore) {
      this.hasPlayedBefore = true;

      this.setState({ autoPlayBlocked: false });

      if (this.autoPlayTimeout) {
        clearTimeout(this.autoPlayTimeout);  
      }
          
    }
  }

  getCurrentTime() {
    if (this.player && this.player.getCurrentTime) {
      return Math.round(this.player.getCurrentTime());
    }
  }

  
  setPlaybackRate() {

    const { primaryPlaybackRate } = this.props;

    // Rate depends on primary rate player
    const rate = primaryPlaybackRate * this.lastEventPlaybackRate;

    const currentRate = this.state.playbackRate;

    logger.debug(`external_video: setPlaybackRate current=${currentRate} primary=${primaryPlaybackRate} lastEventPlaybackRate=${this.lastEventPlaybackRate} rate=${rate}`);

    if (currentRate === rate) {
      return;
    }

    this.setState({ playbackRate: rate });

  }

  handleOnReady() {
    const { hasPlayedBefore, playerIsReady } = this;

    if (hasPlayedBefore || playerIsReady) {
      return;
    }

    this.playerIsReady = true;
    this.handleFirstPlay();

    const { onPlayerReady } = this.props;
  
    if (onPlayerReady) onPlayerReady(ID.EXTERNAL_VIDEOS, this);

      
  }

  handleOnPlay() {
    const { playing } = this.state;

    if (!playing && this.primaryPlayerPlaying) {
        this.setState({ playing: true });
        this.handleFirstPlay();
    }
  }

  handleOnPause() {
    const { playing } = this.state;

    if (playing) {
      this.setState({ playing: false });
      this.handleFirstPlay();
    }
  }

  handleOnBuffer() {
    this.buffering = true;
  }

  handleOnBufferEnd() {
    this.buffering = false;
  }

  handleVolumeChange = (value, isMuted) => {
    this.setState({ volume: parseFloat(value)});
    this.setState({ muted: isMuted});
  }

  
  seekTo(time) {
    const { player } = this;
    
    if (!player) {
      //return logger.error('No player on seek');
      return;
    }

    // Seek if viewer has drifted too far away from presenter
    if (Math.abs(this.getCurrentTime() - time) > SYNC_INTERVAL_SECOND * 0.75) {
      player.seekTo(time, true);
    }
  }

  componentDidMount () {
    this.timer = setInterval(() => this.orchestrator(), ORCHESTRATOR_INTERVAL_MILLISECOND);
  }

  componentWillUnmount () {
    clearInterval(this.timer);
  }

  orchestrator () {
    const { events, active, primaryPlaybackRate } = this.props;
    const { playing, playbackRate } = this.state;

    let primaryPlayerPlaying = true;

    if (this.time === this.lastTime) {
      primaryPlayerPlaying = false;
    }

    this.lastTime = this.time;
    this.primaryPlayerPlaying = primaryPlayerPlaying;

    if (active && !this.hasPlayedBefore && !this.autoPlayTimeout) {
       this.autoPlayTimeout = setTimeout(this.autoPlayBlockDetected, AUTO_PLAY_BLOCK_DETECTION_TIMEOUT_SECONDS * 1000);
    }
    
    const index = getCurrentDataIndex(events, this.time);
    
    logger.debug(`external_video: player time=${this.time} active=${active} Playing=${playing} primaryPlayerPlaying=${primaryPlayerPlaying} PlaybackRate=${playbackRate}`);
    
                       
    if (!primaryPlayerPlaying || !active) {
      this.handleOnPause();
      this.playerUpdateTime = -1;
      return
    }

    if (index && events && events[index] && events[index].type)
    {
        const {type, time, rate, playing}  = events[index];

        logger.debug(`External Video Event: type=${type} time=${time} rate=${rate} playing=${playing}`);
                                        
        switch (type) {
          case "stop":
             this.handleOnPause();
             break;
          case "play":
             this.handleOnPlay();
             break;
          case "playerUpdate":
              if (this.playerUpdateTime !== time) {
                this.lastEventPlaybackRate=rate;
                this.seekTo(time);
                playing ? this.handleOnPlay() : this.handleOnPause()
                this.playerUpdateTime=time;
              } 
              break;
          default:
          ;
        }
    }

    this.setPlaybackRate();
  }

   
  render() {

    const { videoUrl, active, intl } = this.props;
    const { playing, playbackRate, muted, autoPlayBlocked, volume } = this.state;
         
    return (
     
      <div 
          className={cx('externalVideos-wrapper', { inactive: !active })}
          ref={(ref) => { this.playerParent = ref; }}
      >
        {autoPlayBlocked
          ? (
            <p className="autoPlayWarning">
              {intl.formatMessage(intlMessages.autoPlayWarning)}
            </p>
          )
          : ''
        }

        <ReactPlayer
          url={videoUrl}
          config={this.opts}
          volume={volume}
          muted={muted}
          playing={playing}
          playbackRate={playbackRate}
          onReady={this.handleOnReady}
          onPlay={this.handleOnPlay}
          onPause={this.handleOnPause}
          onBuffer={this.handleOnBuffer}
          onBufferEnd={this.handleOnBufferEnd}
          ref={(ref) => { this.player = ref; }}
          width="100%"
          height="100%"
        />
                   
      </div>
    );
    
  }
}

export default (ExternalVideoPlayer);
