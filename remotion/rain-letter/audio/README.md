# 《给晴天的一封信》原创声音 / 30s

## Build

```bash
python audio/synthesize.py
python audio/test_audio.py
```

Requires Python 3, NumPy, SciPy, FFmpeg/ffprobe. Paths resolve against the script, independent of current working directory. `master.wav` is the final mix; do not stretch it or add a second loop. Remotion uses this file at frame 0 with playback rate 1, duration 1800 frames at 60 fps. Host can copy it to `public/audio/master.wav`.

## Creative construction

New 30-second through-composed piece, not recycled from any previous 15-second render. Six 5-second harmonic scenes progress from D-minor-add9 through Bb/F/C to warm F-major colors. Nineteen asymmetrically spaced piano melody notes leave breathing space around the transformations. Four quiet wood-resonator accents—not continuous chimes—mark selected reveals. Synthesized upper sine partials provide soft string-harmonic-like sustain; these are not recorded acoustic instruments.

Stereo rain uses a seeded continuous noise stream and distinct small impacts, then recedes as daylight arrives. A bending sine resonator supplies the two narrative drops. Short, band-limited noise gestures supply paper folds and the ink river. No third-party samples, downloaded music, external services, or paid generation. This is an original procedural score/foley design, not a transcription or imitation of a particular artist's soundtrack.

`cues.json` is the timing contract with the visual component. The final two seconds contain only decaying existing material; no new melody events. The window-opening movement should align to 17.2–19.2s, paper-umbrella action to 10.4–12.2s, and sun watermark to 27.5s.

## Measured QA

`qa.json` contains FFmpeg loudnorm measurements of the exported PCM24 file, not estimates of the source array.

- 30.000s, 1,440,000 frames, 48kHz, stereo, signed PCM24
- Integrated loudness: **-19.99 LUFS** (target -20)
- True peak: **-7.08 dBTP** (ceiling -2; substantial headroom retained)
- Loudness range: **3.8 LU**
- SHA-256: `2496e650b01ef89205f3430c1bf3d97bcbeea7c537f38ab358801649e3780f2f`
- Eight automated tests pass: format/length, cue contract, measured loudness/peak, finite/no clip/DC, no 15s repeat, stereo, clean quiet ending, exact regeneration hash.

Deterministic within the current NumPy/SciPy/FFmpeg environment. Different dependency/FFmpeg versions may change last-bit output; the test compares two builds in the same environment rather than relying on a cross-platform golden hash.

**Listening review has not been performed.** Objective checks do not establish musical beauty, perceptual instrument realism, or visual synchronization; the assembled video still needs actual playback review. Source cues are aligned numerically, but foley is intentionally soft and may need adjustment after video review.
