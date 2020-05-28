#!/bin/bash

BBB_PLAYBACK_HOMEPAGE=playback/presentation/2.3
BBB_PLAYBACK=/var/bigbluebutton/$BBB_PLAYBACK_HOMEPAGE

npm run-script build
sudo rm -rf $BBB_PLAYBACK
sudo cp -r ./build $BBB_PLAYBACK
sudo chown --recursive bigbluebutton:bigbluebutton $BBB_PLAYBACK
