# Paper bird — original 24-second score

Rebuild: `python audio/generate.py` (Python 3, NumPy, SciPy, FFmpeg).
Test: `python -m unittest discover -s audio -p 'test_*.py'`.

Deliverable: `public/audio/master-safe.wav`, mirrored at `audio/master-safe.wav`.
Exactly 1,152,000 frames/channel, 48,000 Hz, stereo PCM16, 24.000 seconds.
Separate aligned `audio/music.wav` and `audio/sfx.wav` stems are retained.

An original 120 BPM six-phrase D-major journey uses rounded wood/pizzicato
harmonics, a soft airy melodic voice, bass and quietly widening sustained tones.
Paper flutter accompanies the 0.55 s crouch and 1.0 s takeoff, then becomes a
subtle texture rather than accenting every wingbeat. Light filtered air marks
the 4/8/12/16/20-second transitions; water opens around 15.5 s, and a soft
climbing wind cue supports 16 s. The final phrase resolves and fades naturally.
No recordings, external assets, reused fight score, paid APIs, percussion
impacts, explosion sounds, voices, or alert beeps are used.

`cues.json` records director-confirmed 30 fps anchors and exact sample positions.
Cues denote visual landmarks, while gentle transition swells intentionally
begin shortly before the cut. The free-running paper texture is not a literal
per-wingbeat Foley synchronization promise.

Measured using FFmpeg EBU R128 loudnorm analysis: **−20.00 LUFS-I,
−9.03 dBTP, 2.00 LU LRA**. Read `input_*` values in `measurements.json`, which
measure the saved file. The `output_*` fields are FFmpeg's hypothetical filter
output and are not the saved master. The actual master uses constant linear
gain, not FFmpeg dynamic processing. Edges are digital zero; no clipping.
Five automated tests pass. A second full generation produced identical SHA256
checksums for all listed artifacts. This is objective signal/file validation;
no human listening or audiovisual playback review is claimed.
