# Original 12-second stick duel soundtrack

This score and all foley are synthesized from mathematical oscillators and seeded noise. No audio or samples from the uploaded reference films are used.

## Files
- `master.wav`: 12.000 seconds, 48 kHz, 16-bit stereo, final music + foley.
- `music.wav`, `foley.wav`: matching stems after shared bus dynamics and gain. They sum to the master within PCM quantization.
- `cues.json`: exact 60-fps cue frame/time pairs with action meaning.
- `synthesize.py`: deterministic generator, requires NumPy and SciPy; no FFmpeg dependency to generate audio.
- `test_audio.py`: eight checks for exact duration, stereo, peak headroom, silent edges, nonrepeated halves, frame-locked cues and foley variation.

## Production cue contract
Blocked jab at frame 84; airborne kick hit 174; descending kick block 294; body shot hit 350; uppercut finisher 455; tumble landing 550. Windup whooshes end near their respective contacts. Misses have whooshes but no impact. Landings and recovery friction remain lower than the finisher. Score uses a restrained original D-minor bass/pluck/percussion motif and is ducked around contacts. End recovery is quieter.

## Verification
Generated twice with identical SHA256. All eight tests pass. FFmpeg loudness measurement (measurement only, not a normalizing transcode): integrated -18.04 LUFS, true peak -6.76 dBTP, LRA 5.2 LU. Full stream is exactly 576000 stereo sample frames. The first and last 5 ms are silent.

Master SHA256: eb4203a1f9b950d173830f018f15f3c3da78ad5a96fdcb8e92964bc2e905c3bc

No real-time subjective listening was performed; these are technical verification results, not a claim of listening or user aesthetic approval. If the visual action timeline changes, update `cues.json`, regenerate, and repeat measurements/tests before copying into the video project.

Rebuild: `python synthesize.py`
Tests: `python -m unittest discover -s . -p 'test_audio.py'`
