import { ID } from 'utils/constants';
import Synchronizer from 'utils/synchronizer';

const PLAYERS = {};
let SYNCHRONIZER = null;

const player = {
  get primary() {
    return this.webcams;
  },
  get screenshare() {
    return PLAYERS[ID.SCREENSHARE];
  },
  get synchronizer() {
    return SYNCHRONIZER;
  },
  get webcams() {
    return PLAYERS[ID.WEBCAMS];
  },
  set screenshare(value) {
    PLAYERS[ID.SCREENSHARE] = value;

    if (this.synchronizer) {
      this.synchronizer.destroy();
      this.synchronizer = null;
    }

    if (value && this.webcams) {
      this.synchronizer = new Synchronizer(this.webcams, this.screenshare);
    }
  },
  set synchronizer(value) {
    SYNCHRONIZER = value;
  },
  set webcams(value) {
    PLAYERS[ID.WEBCAMS] = value;

    if (this.synchronizer) {
      this.synchronizer.destroy();
      this.synchronizer = null;
    }

    if (value && this.screenshare) {
      this.synchronizer = new Synchronizer(this.webcams, this.screenshare);
    }
  },
};

export default player;
