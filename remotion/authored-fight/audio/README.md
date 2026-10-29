# Original authored-fight score (7 seconds)

- Deliverable: `master.wav`, 48,000 Hz stereo PCM16, exactly336,000 samples (210 frames at30fps). Local integration copy: `../public/audio/master.wav`. No external upload/publication performed.
- Original procedural synthesis only: rounded wood-bass resonances, restrained syncopated wooden percussion, band-limited air/fabric, body and floor transients. No speech, titles, stock samples, paid services, or licensed recordings.
- `music.wav` and `sfx.wav` are same-gain stems. Summing PCM stems may differ from master by1LSB due to independent quantization.
- `generate.py` is seeded, reproducible with current NumPy/SciPy/FFmpeg toolchain. Run `python audio/generate.py`, then `python audio/test_audio.py` from project root. `cues.json` gives frame/sample anchors. Instrument attacks begin at anchor (no pre-contact impact).

## Director-confirmed cue semantics

26 counter body contact;50 first palm/ground brace;105 evaded low kick = air only, NO hit;135 resisting guard/frame = soft cloth (not punch/parry);143 modest shoulder/body contact;153 catch/backstep;164 second hand brace;177 soft seated-floor settle. Entry air cues19 and130 are movement texture, not contact. No invented83 footfall. Score accents intentionally do not strike every pose. Motion source hashes in cues record the source inspected at generation, not artistic approval or a final source freeze.

## Verified measurements

FFmpeg `loudnorm` **input** statistics on final PCM: **-19.76 LUFS integrated, -2.20 dBTP**,2.90 LU loudness range. Exact duration7.000s.192kbps AAC codec probe: **-19.77 LUFS, -2.18 dBTP**. The JSON also contains loudnorm hypothetical normalized output stats; those are NOT measurements of our delivered file. No loudnorm processed output is used: generation applies only fixed master gain.

Tests cover format/duration, anchored cues and miss semantics, level bounds, local copy equality, edge fade and no clipping. Rebuilding the same inputs yielded an identical PCM SHA256. See `test-results.txt`, `measurements.json`, `codec-check.log`, `SHA256SUMS`.

## Limits

These are numerical loudness/format/anchor checks, not normal-speed subjective listening approval or final audiovisual-sync certification. The final render host should measure its actual encoded delivery again; codec settings can alter true peak. Very short7-second R128 loudness and LRA statistics have limited perceptual robustness. Audio should remain subordinate to readable movement; final listener review may warrant tasteful mix changes.

## Remotion delivery selection

The composition uses `public/audio/master-safe.wav`, a 0.7 dB attenuation of the original master. Measured PCM: -20.46 LUFS, -2.90 dBTP. SHA-256 `31d19184e7c05b8659c5ef82f477a8fc5a046e8211f7a2a64b063ec168657df9`. The local host regenerates cue source hashes from the exact frozen `src/poses.json`; it does not depend on a missing candidate directory. Final encoded AAC is measured again by `scripts/verify_output.py`.
