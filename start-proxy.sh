#!/bin/bash
echo ""
echo "BBB Playback - Proxy Dev Server"
echo "--------------------------------"
echo ""
read -p "Remote host URL (e.g. https://scalelite.example.com): " PROXY_HOST
echo ""

if [ -z "$PROXY_HOST" ]; then
  echo "No URL provided. Starting without proxy..."
  echo ""
  npx react-scripts start
else
  echo "Proxy target: $PROXY_HOST"
  echo ""
  PROXY_HOST="$PROXY_HOST" npx react-scripts start
fi
