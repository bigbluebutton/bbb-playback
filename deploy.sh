#!/bin/bash

PLAYBACK_PATH=/var/bigbluebutton/playback/presentation/3.0

npm run-script build
rm -rf $PLAYBACK_PATH
cp -r ./build $PLAYBACK_PATH
chown --recursive bigbluebutton: $PLAYBACK_PATH
