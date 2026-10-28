# Native Fox and Stork render handoff

## What this is

A **native huashu**, Playwright + Canvas + ffmpeg pipeline; no Remotion. Fixed upstream: `alchaincyf/huashu-art-motion@8a0d7d72ca65fcce6f8ba82c4a6c8dfe35b8422c`. CI checks that SHA and a clean checkout, copies the scripts, and adds original film files. It refuses to overwrite any upstream renderer, core, font or example file. New movie code lives separately under `huashu/fox-stork/engine/`.

Local CI preparation only. No remote commit, push, workflow dispatch, artifact upload, publication, credential creation or past-artifact deletion has been performed by this worker.

## Integration files

Copy these **new paths** to a new history-preserving branch based on the desired repository commit:

- `.github/workflows/huashu-fable.yml`
- `.github/actions/setup-huashu/action.yml`
- `huashu/tools/ci.py`
- `tests/test_huashu_ci.py`
- `requirements-huashu-ci.txt`
- `HUASHU-CI.md`
- `huashu/fox-stork/render-config.example.json` (reference; copy to `render-config.json` and integrate actual sources)

Add the independent movie package:

- `huashu/fox-stork/engine/eras_fox_stork.js`
- `huashu/fox-stork/engine/fox_stork/…` (original scene/world/actors/timeline files)
- `huashu/fox-stork/镜头表.md`
- `huashu/fox-stork/audio/synthesize.py`, `audio/test_audio.py` and any small source cue/score metadata

Do **not** commit the generated WAV/M4A/MP4s, `.native/`, test temporary files or `__pycache__`. The audio script rebuilds the full 65-second music+Foley mix on runners; CI muxes `audio/master.wav` to avoid an unnecessary AAC generation. `audio/music.m4a` is already the full mix; do not combine it with another Foley stem.

The helper deliberately does **not** live in `scripts/`: the current repository's legacy `smoke.yml` triggers on `scripts/**` and would run an unrelated WebGL smoke if we placed the helper there. Existing workflows are not modified.

## Operation

Use the actual new branch `feat/huashu-fox-stork`, `render/huashu-fox-stork` or `render/huashu-fox-stork-<suffix>`; workflow push filters are limited to those new render branches and the new file paths.

1. First commit: `render-config.json` has `"mode":"smoke"`. Push triggers plan/tests, then native selected stills and a representative 5-second clip only. `audio:null,audioBuild:[]` is allowed in smoke mode if audio is not ready. The example config includes final audio rebuild commands.
2. Download and visually inspect critical contacts (12.6, 40.6, 45.6 seconds) and the normal-speed representative clip. Smoke native QA optionally checks `smokeIds`; empty list is reported truthfully as not run. Capture any corrections in code before final rendering.
3. Once that exact art/motion is acceptable, update only mode to `"final"` and add `"reviewedSmokeRun":"<actual run ID>"`. Push the new commit. This is an operator review acknowledgement, **not** cryptographic attestation of artistic approval. It avoids workflow-dispatch tool dependency and does not repeat smoke merely to launch final.
4. Final mode runs native QA over all scenes, checks sampled cold/hot determinism and page errors, then 13 contiguous 5-second chunks at 30fps, at most four workers. Chunk workers skip redundant audio synthesis; native QA preflight already built/verified the soundtrack.
5. Assembly checks exact source/upstream/commit provenance, chunk hashes, contiguous frame ranges, 1,950 decoded frames, and codec/fps/dimensions; concatenates native chunks, makes a size-bounded 720p H.264 review file with AAC audio, reruns encoded-film gate, and records loudness measurement.
6. A red film gate fails assembly **after preserving** the review video, gate output and provenance for diagnosis. Yellow/green do not replace independent real-time visual/audio review. Publish/deliver only after that separate review.

No `gh`, PAT, personal secrets, paid APIs, paid/larger runner, user computer or repository write permission is used inside Actions. `actions/checkout` disables persistent credentials. The caller alone makes authorized remote writes. This uses standard hosted `ubuntu-22.04`; account quota/billing is not altered.

## Artifacts and provenance

An independent size-check step guards even failure/diagnostic uploads; oversized diagnostic folders are not uploaded. Every newly uploaded artifact is configured for 1-day retention; previous artifacts remain untouched. Each successful bundle is checked strictly below **14,000,000 bytes**, leaving archive overhead below a 15MB limit. PNG smoke originals remain temporary; user-review stills are JPEG. Native 1080p chunks are retained separately; only exceptionally large chunks are explicitly re-encoded with recorded parameters. The final file is a 720p size-bounded review derivative, not claimed to be an untouched master. Original source is the repository commit + exact public upstream pin.

Each artifact contains `provenance.json` and `SHA256SUMS`: repository/ref/commit, workflow/run/attempt, actual dependency versions, SHA256 source manifest, fixed upstream commit, range/count/probe data, audio hash when built, encoding decisions, artifact hashes and a truthful `independentVisualAudioReview: pending` note. The final bundle includes each chunk's provenance. It is an unkeyed evidence chain, not a cryptographic signature.

## Reproduce locally in an authorized cloud workspace

Install exact requirements and Chromium, have ffmpeg/ffprobe available, and clone upstream at the exact SHA to `.native/upstream`. With source/config present:

```sh
python -m unittest discover -s tests -p test_huashu_ci.py -v
python huashu/tools/ci.py matrix
python huashu/tools/ci.py prepare
python huashu/tools/ci.py smoke --out huashu-smoke
# Or after final configuration/approval:
python huashu/tools/ci.py qa --out huashu-qa
python huashu/tools/ci.py chunk --part 000 --out huashu-part-000
```

Each prepare uses a fresh work directory and refuses overwriting existing `.native/work`. A fresh runner already guarantees that. For local reruns use a new `--work` consistently rather than deleting prior results.

## Verification actually completed during preparation

- Repository main read at `cc4581c299c201e47e41a5f1abb33b6ff262f014`; existing `preflight.yml`, `render.yml`, `smoke.yml` inspected.
- Native `audit/quality.md`, `audit/workflow.md`, upstream render/QA/gate interfaces inspected.
- 11 unittest cases passed, including two real ffmpeg integration tests (two-pass encode with audio; decode/frame/probe integrity), rejection of tampered/missing/wrong-commit chunks, invalid ranges, path escape and size overflow.
- Both YAML files parsed; static assertions confirm standard Ubuntu runner, five jobs, 1-day retention.
- No actual movie/browser render or hosted GitHub run is claimed by this preparation report. The first remote smoke establishes renderer support and visual output.

## Scope notes

Native QA's determinism is sampled/reduced resolution, not exhaustive all-frame proof. Its framing/motion warnings need human inspection; this wrapper additionally rejects sampled nondeterminism. The film gate measures three narrow conditions, not storytelling, rights, visual appeal or audio clarity. Soundtrack existence/duration and loudness are technical checks, not listening approval. No arbitrary forced animation is added solely to satisfy motion metrics.
