#!/usr/bin/env bash
# Rebuild sound from source only. Never downloads or muxes author's published video.
set -euo pipefail
cd "$(dirname "$0")/.."
A=film/audio
python film/tools/foley.py
python tools/audio/sfx.py lib "$A/sfx"
python tools/audio/music.py "$A/score.json" "$A/music.wav"
python tools/audio/mix.py "$A/mix.wav" profile=cartoon music="$A/music.wav" events="$A/events.json" lib="$A/sfx" dur=12 fade=0.04 music_db=-7 tp=-1.911 stems="$A/stems"
ffmpeg -hide_banner -loglevel error -y -i "$A/mix.wav" -t 12 -c:a aac -b:a 192k "$A/mix-aac.m4a"
python scripts/verify-audio.py
