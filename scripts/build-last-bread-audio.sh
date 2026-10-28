#!/usr/bin/env bash
# Original pilot only. Reuses synthesizers, never the old film's score or finished audio.
set -euo pipefail
cd "$(dirname "$0")/.."
A=film/last-bread/audio
mkdir -p "$A"
node scripts/last-bread-events.mjs --check
python tools/audio/sfx.py lib "$A/sfx"
python tools/audio/music.py film/last-bread/score.json "$A/music.wav" --length 5
python tools/audio/mix.py "$A/mix.wav" profile=cartoon music="$A/music.wav" events=film/last-bread/events.json lib="$A/sfx" dur=5 fade=0.06 music_db=-5 lufs=-14 tp=-3.0 stems="$A/stems"
ffmpeg -hide_banner -loglevel error -y -i "$A/mix.wav" -t 5 -ar 48000 -ac 2 -c:a aac -b:a 192k "$A/mix-aac.m4a"
python scripts/verify-last-bread.py --audio "$A/mix-aac.m4a" --out "$A/technical-qa.json"
