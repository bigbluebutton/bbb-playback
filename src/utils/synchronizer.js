
export default class Synchronizer {
  constructor(primary, secondary) {
    this.primary = primary;
    this.secondary = secondary;

    this.seeked = false;
    this.synching = false;

    this.init();
  }

  init() {
    this.primary.on('play', () => {
      if (!this.secondary) return null;

      this.secondary.play();
    });

    this.primary.on('pause', () => this.sync());

    this.primary.on('seeking', () => {
      if (!this.primary) return null;

      const played = this.primary.played();
      if (played.length !== 0) {
        this.seeked = true;
      }
    });

    this.primary.on('seeked', () => {
      if (!this.primary) return null;

      if (this.primary.paused()) {
        this.sync();
      } else {
        this.primary.pause();
      }
    });

    const players = [
      this.primary,
      this.secondary,
    ];

    players.forEach(player => {
      player.on('waiting', () => {
        if (!this.primary) return null;

        const seeking = this.primary.seeking();

        if (!seeking && !this.synching) {
          this.synching = true;
          this.primary.pause();
        }
      });

      player.on('canplay', () => {
        if (!this.primary && !this.secondary) return null;

        if (this.seeked || this.synching) {
          if (this.primary.readyState() === 4 && this.secondary.readyState() === 4) {
            this.seeked = false;
            this.synching = false;
            this.primary.play();
          }
        }
      });
    });
  }

  sync() {
    if (!this.primary && !this.secondary) return null;

    if (this.secondary.readyState() > 1) {
      this.secondary.pause();
      const currentTime = this.primary.currentTime();
      this.secondary.currentTime(currentTime);
    }
  }
}
