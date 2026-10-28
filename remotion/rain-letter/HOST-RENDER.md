# Rain Letter render host

Original 30-second composition: 1920×1080, 60 fps, 1800 frames. `src/RainLetter.tsx` exports `RainLetter`; `src/Root.tsx` adds the single timeline-aligned soundtrack.

## CI staging
- Repository project directory: `remotion/rain-letter`.
- Move `.github/workflows/remotion-rain-letter.yml` from this handoff folder to the **repository root** `.github/workflows/`.
- Include source, tests, scripts, audio synthesis/tests/cues, plan, and package lock. Do not commit node_modules, `.tmp`, artifacts, WAV/QA generated output or caches.
- Package lock preserves all previously validated exact dependency pins; only root package name changed. Unused original 3D packages remain for lock continuity; current composition does not import them.

## Review gate
Initial `render-plan.json` is `phase: preview`: eleven real Remotion stills plus 10.2–12.5 s and 17.0–19.5 s clips. Each short includes the corresponding segment of the original 30-second soundtrack. Source-frame indices are explicit, end-exclusive in the plan and inclusive only at Remotion's renderMedia API boundary.

After independently viewing the transformation clips with sound, the responsible reviewer may set `phase: final` and record the actual 40-character `approvedPreviewCommit`. Only then does CI render the 30-second film. This field does not itself prove aesthetic approval; the reviewer must provide it honestly.

Every run checks out its exact SHA. A repeated keyframe after out-of-order seeking checks render determinism. Actual keyframes must have expected dimensions and nontrivial variance. Review video is 720p60 H.264/yuv420p with 48kHz stereo AAC; ffprobe checks exact decoded frame count and full decoding must succeed. Native 1080p masters stay off the uploaded artifact but their hashes and probes are retained. Dense contact sheets retain every frame in the transformation windows; final additionally checks 25–28 s stamp return. Artifact evidence and hashes are finalized in an always step; uploads over 14,000,000 bytes or without evidence are rejected. Retention: one day.

## Verification boundary
Locally passed: six Node host/lock tests, three Python packaging tests including synthetic-video roundtrip and dense-sheet indexing, JS/Python syntax. These synthetic tests do **not** validate animation quality. No local npm install, TypeScript compiler, Chromium scene render or visual acceptance is claimed; these remain CI/reviewer steps.

Run locally only when dependencies exist:
```
npm run typecheck
npm test
python tests/test_packaging.py
python audio/synthesize.py
python audio/test_audio.py
mkdir -p public/audio && cp audio/master.wav public/audio/master.wav
node scripts/render.mjs
python scripts/package_review.py check-size
```
