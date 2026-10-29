# Industrial Exit — original 15-second soundtrack

Final timeline: 15 seconds / 900 frames at 60 fps. The earlier 18-second music-only draft is superseded and must not be used for production.

All music and foley are newly synthesized from seeded noise and mathematical oscillators. No audio from the uploaded reference films is copied. The original E-minor rhythm supports a brief warning, two exchanges, a control-box accident, escape and closing-door ending. It is ducked at contact events, with quieter ending space.

## Final contact contract
- Frame 74 (1.233333s): forearm BLOCK, not body impact.
- Frame 192 (3.200000s): counter forearm BLOCK, not body impact.
- Frame 382 (6.366667s): spinning kick strikes CONTROL CABINET only.
- Frame 388: electrical acknowledgement.
- Frames 398–498: shutter motor opens exit.
- Frames 584 and 630: quiet running fabric/air movement.
- Frame 578: gentle start scuff. Frames 611/631/647/667: low-level steps at verified native ToeBase height minima; high-foot candidates were excluded.
- Frames 718–818: shutter closes.
- Frame 818: lock/latch and red light return.

## Files and rebuild
`master.wav` is final 15.000s, 48kHz, 16-bit stereo. `music.wav` and `foley.wav` are matching stems. `cues.json` owns exact frame/event times. Generate using `python synthesize.py`; the script needs NumPy and SciPy, not system FFmpeg. Copy resulting master to `public/audio/exit-fight.wav` in the animation project. `sfx/` holds optional isolated original effects, but the generator recreates final foley directly and does not need these files.

`test_audio.py` supplies eight checks: existence, exact duration/stereo, peak headroom, silent edges, stereo separation, cue alignment, musical ending dynamics and nonuniform foley. Tests: `python -m unittest discover -s . -p test_audio.py`.

## Verified measurements
All eight tests passed. Two complete generations produce the same SHA256. FFmpeg measurement only: -18.47 LUFS integrated, -4.68 dBTP, LRA 4.5 LU. Exact 720000 stereo sample frames, with first and last 5ms silent.

Master SHA256: 0a7860848965a7df7f40dac351bd12a0f84ea64880853a0de37490661c63aaa1

These are technical measurements, not real-time subjective listening or user aesthetic approval. If verified foot-contact frames or the visual timeline change, regenerate from updated cues and rerun checks before replacing production master.
