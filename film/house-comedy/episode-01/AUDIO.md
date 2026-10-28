# EP01《安静一点》— Original score and foley

32.000 seconds; stereo PCM 16-bit, 48 kHz. No speech, external samples, stock music, network fetches, or third-party sound assets. NumPy deterministic synthesis, seed 20261028. The older teapot film is unchanged.

## Build and assembly

```sh
python scripts/episode01/build_audio.py
# optional: --out /path/to/audio
```

Generated `audio/mix.wav` is the final mix; `music.wav` and `sfx.wav` are aligned stems with the **same common gain** and sum to the mix (within PCM rounding). Each contains 1,536,000 stereo sample frames. `audio-build.json` records events, peak/RMS/clipping, exact quiet test, and FFmpeg loudness analysis. Parent owns video mux; retain full 32 seconds and do not loop this score.

## Picture sync contract

Times are seconds from picture start. `CUES` in the Python source is authoritative for sound effects and may be retimed after picture review. Sparse score phrases are separately visible in the source; don't stretch the whole soundtrack to fix one event.

| Time | Sound | Intent |
|---:|---|---|
| 0.65 | paper straighten | quiet baseline, left |
| 1.15 | tiny relief breath | relaxed reading |
| 2.00 / 3.00 | ball bounces | pitched rubber, second slightly heavier, right |
| 5.50 | catch | short muted impact, not a third bounce |
| 6.80 | box lid | dry woody click, left |
| 9.25 | belly test | brief elastic note |
| 12.20 / 14.40 | body bounces | lower, heavier than ball; second stronger |
| 16.30–17.50 | chair roll | quiet textured wheel rumble |
| 18.00 | cushion landing | soft air release and bass, no hard collision |
| 19.50 | happy breath | settling, no dialogue |
| 20.70–21.80 | yawn | rounded pitched breath, not speech |
| **22.00–24.00** | **literal digital silence** | genuine success, no suspense pad |
| 24.80 | small snore | soft low rasp, right |
| 26.30 | inhale | builds without musical warning |
| 27.50 | large snore | breathy low rasp, no explosive bang |
| 27.80 | newspaper flap | dry high-frequency paper + soft face contact, left |
| 28.70 | low pizzicato resumes | reaction gap after paper impact |
| 30.50 | paper smooth | small tactile callback |
| 31.20 / 31.38 | two-note cadence | understated iris finish |

## Mix philosophy and measurements

No continuous pad. Music leaves space before bounces and during quiet success and impending snore. Equal-power panning follows left reader/right sleeper; no extreme hard pan. Body impacts are low, balls are pitched, paper is high-passed noise, wheels are soft irregular noise, and snores use modulated harmonic breath. These are intentionally synthesized/cartoon sounds, not recorded realism.

Test on 2026-10-28:
- Duration **32.000 s**, stereo **48,000 Hz**, 16-bit PCM.
- Sample peak **−2.50 dBFS**, analyzed true peak **−2.48 dBTP**.
- Integrated loudness **−25.54 LUFS**; LRA **14.20 LU**, intentional sparse quiet comedy.
- No clipped samples; 22–24 s peak **0.0** exactly.
- FFmpeg analysis exit code **0**.

The loudnorm JSON includes hypothetical output statistics from an analysis-only null pass. **No loudnorm normalization/compression was applied** to the WAV. Do not treat its hypothetical −18.39 LUFS output as the mix's actual loudness. Raising the entire mix to −18 LUFS without limiting would clip the final gag; preserve dynamic contrast unless picture/audition calls for a deliberate remix.

No human listening or audiovisual synchronization approval is claimed. Objective checks establish valid sound-bearing files and event timing; final assembled animation still needs picture/sound review.
