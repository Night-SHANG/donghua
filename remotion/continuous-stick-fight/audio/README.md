# Continuous fight — original parametric audio

Pending frozen visual contract. No master is valid until generated from frozen `film-spec.json` and `src/poses.json`.

## Rebuild

```sh
python audio/derive_cues.py .
python audio/synthesize.py
python -m unittest discover -s audio -p 'test_*.py'
mkdir -p public/audio
cp audio/master.wav public/audio/continuous-fight.wav
```

Python dependencies: numpy, scipy. Synthesis uses no copied audio, external service, or FFmpeg. Original seeded oscillator/noise music and foley. All outputs are local.

Single source of duration: `film-spec.json.durationInFrames` and `fps`; asserts pose count agrees. Samples = frames × (48000 / fps), exactly frames × 800 at 60 fps. `cues.json` is derived, not a second editable film specification. Source file hashes are recorded.

Only verified `contacts.kind` values block/rail/impact create contact sounds. Threat-phase/misses receive anticipation whooshes only, including the missed pushkick. Final impact requires the terminalReaction contract. Verified scene_events can add footsteps/landings; no invented heavy footfalls. Original 138 BPM percussion/bass pattern supports action; contact events duck the musical bed. Final cadence and fade leave a clear ending.

Measurements and deterministic SHA will be added after freeze. Technical validation does not constitute subjective listening or aesthetic approval.

## Candidate measured 2026-10-29

676 frames at 60 fps; 11.266666667 s, exactly 540800 stereo sample frames at 48 kHz, PCM16. Source poses SHA256 `d100c7f38b7d488d820804255ae8629f0e3af14ec34c1cfda9c6cecaea367e4b`.

Verified cues: rail f492, true final hit f600, landing f631; other impacts only verified blocks. Missed pushkick has air only. Master SHA256 `952162bf7f5b972f2601a4f1c488b71f071787a18a7049bbfed8f08a78a69ed7`. Cue SHA256 `e4f1d4ef39f5198a99419b62bb458929450d862beb588b2dd5cea4bbcdda05a0`.

FFmpeg loudnorm input measurement: -17.79 LUFS integrated, -6.05 dBTP true peak, 4.60 LU loudness range. Fourteen tests pass, and repeat synthesis SHA matches. Musical tail test uses music stem rather than master, because the final verified hit/landing intentionally raises late foley energy. No clipping. No subjective real-time listening performed.
