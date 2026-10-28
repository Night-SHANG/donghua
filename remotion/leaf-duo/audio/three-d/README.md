# Remotion Leaf Duo — three-d original audio

A大调竖琴、钢琴、玻璃泛音与低暖垫：温室螺旋、荷塘掠水、石灯旋风、冬灯归宿。

15.000 s / 48,000 Hz / stereo / PCM 24-bit. Target -20 LUFS, true peak below -2 dBTP. Master, music-only and foley-only stems are generated locally. Original note sequences, arrangement and gesture cues; no external recordings, score, melody, sample pack, paid service or generative-audio API. Existing verified synthesis primitives were reused, not any prior soundtrack or MIDI arrangement.

## Rebuild

Requires Python 3, numpy, scipy and ffmpeg/ffprobe:

```sh
python audio/three-d/synthesize.py
python audio/three-d/test_audio.py
cp audio/three-d/master.wav public/audio/three-d.wav
```

Root owns the only Audio component. Do not also add one within a visual component. JSON manifest includes exact story boundaries, notes and foley cues. Both ends are zero; final 0.8-second equal-power-style decay leaves a natural tail. Dry gap after a gesture is intentional, with the musical bed sustaining.

## Verification and boundary

Eight automated tests check format, exact samples, endpoints/DC/peaks, freshly measured loudness, precise cues, continuity/mono compatibility, nonuniform gesture timing, decoding and deterministic regeneration of master/stems. `build-result.json` stores measured results and hashes; `test-result.txt` records the local run. Cross-platform dependency/ffmpeg differences may change bytes slightly: determinism is checked within each environment, not claimed universal.

This is procedural instrumental synthesis (piano-/harp-/wood-like timbres), not a recording of acoustic instruments. No subjective listening or final video audiovisual review has been performed by this audio worker. Passing tests does not establish musical quality or subjective audiovisual coherence; rendered video still requires review. No external source attribution/license dependencies are introduced by the generated score or sounds.
