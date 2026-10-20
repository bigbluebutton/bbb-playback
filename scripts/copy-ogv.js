// Copies the parts of ogv.js the player loads at run time (the WebM demuxer
// and the VP8, VP9, Opus and Vorbis decoders) to public/ogv, from where
// browsers that cannot play WebM themselves (Safari) fetch them on demand.
// Runs before `npm start` and `npm run build`.
const fs = require('fs');
const path = require('path');

const source = path.join(path.dirname(require.resolve('ogv/package.json')), 'dist');
const target = path.join(__dirname, '..', 'public', 'ogv');

const FILES = [
  'ogv-worker-audio.js',
  'ogv-worker-video.js',
  'ogv-demuxer-webm-wasm.js',
  'ogv-demuxer-webm-wasm.wasm',
  'ogv-decoder-video-vp8-wasm.js',
  'ogv-decoder-video-vp8-wasm.wasm',
  'ogv-decoder-video-vp9-wasm.js',
  'ogv-decoder-video-vp9-wasm.wasm',
  'ogv-decoder-audio-opus-wasm.js',
  'ogv-decoder-audio-opus-wasm.wasm',
  'ogv-decoder-audio-vorbis-wasm.js',
  'ogv-decoder-audio-vorbis-wasm.wasm',
  'COPYING',
  'LICENSE-vpx.txt',
  'PATENTS-vpx.txt',
  'COPYING-opus.txt',
  'COPYING-vorbis.txt',
  'LICENSE-nestegg.txt',
];

fs.rmSync(target, { force: true, recursive: true });
fs.mkdirSync(target, { recursive: true });
FILES.forEach(file => fs.copyFileSync(path.join(source, file), path.join(target, file)));
