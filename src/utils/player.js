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
    if (!PLAYERS[ID.SCREENSHARE]) PLAYERS[ID.SCREENSHARE] = value;

    if (this.webcams) {
      this.synchronizer = new Synchronizer(this.webcams, this.screenshare);
    }
  },
  set synchronizer(value) {
    if (!SYNCHRONIZER) SYNCHRONIZER = value;
  },
  set webcams(value) {
    if (!PLAYERS[ID.WEBCAMS]) PLAYERS[ID.WEBCAMS] = value;

    if (this.screenshare) {
      this.synchronizer = new Synchronizer(this.webcams, this.screenshare);
    }
  },
};

export default player;
