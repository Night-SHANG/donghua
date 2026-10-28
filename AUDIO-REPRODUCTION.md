# Original showcase soundtrack: source-only rebuild

Source: MIT-licensed ZLHad/OpenVideoHarness main, downloaded 2026-10-28. Preserve LICENSE-harness. `audio-source-provenance.json` records included source SHA256 hashes; no upstream commit identity or byte identity with the author's released soundtrack is claimed.

Runtime: Python 3.12, ffmpeg/ffprobe, exact NumPy 2.3.5 and SciPy 1.17.0. Install into an isolated environment using `python -m pip install --only-binary=:all: -r requirements-audio.txt`, then `bash scripts/build-audio.sh`.

The script synthesizes original custom foley, the engine's built-in SFX and original score; mixes 38 timed events with the original cartoon profile (12 seconds, 40 ms fade, music -7 dB). It never reads or downloads an author's published MP4/audio. Its input is only the score/events/code. The mix's technical peak ceiling is -1.911 dBTP, the prior source script's prescribed corrective adjustment to keep this AAC encode under -1.5 dBTP. This does not change composition or cue timing.

Verified locally 2026-10-28: build completed; 12.000 seconds, AAC 192k, stereo 48000 Hz; original mix measured -14.01 LUFS and -1.91 dBTP; encoded AAC true peak -1.9056977 dBTP. `scripts/verify-audio.py` rejects wrong encoding, rate, channels, duration or excessive peak. Detailed original `tools/audio/qa.py` is included but requires optional librosa and is not run by this minimal script. Earlier independent original QA of byte-identical WAV/AAC passed 30/30 cues, with six marginal onset and eight sound-class balance warnings. No human listening review is claimed.

Outputs: film/audio/mix.wav, film/audio/mix-aac.m4a, film/audio/stems, film/audio/technical-qa.json. Stream-copy the AAC into **newly rendered** picture, never the source project's published picture. The source-provenance JSON is the source identity; generated audio and environments are not source files.

Final GitHub-produced MP4 passed a separate 30/30-cue QA; see `RENDER-RESULT.md` for its encoder-specific peak/loudness and warnings.
