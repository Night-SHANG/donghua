# Clawd and the Leaf — original-source rerender

This repository reproduces the MIT-licensed [OpenVideoHarness showcase](https://github.com/ZLHad/OpenVideoHarness/tree/main/showcase/01-handdrawn-clawd-leaf). The published author MP4 is **not** a rendering input.

- Original scene/engine JS retained byte-for-byte (SHA256 in `source-provenance.json`). The upstream snapshot was collected from `main`; a full upstream commit was not recorded, so file hashes are the provenance identity.
- Original MIT notices: `LICENSE-harness` (ZLHad/contributors), `LICENSE-engine` (John Heibel).
- npm lock pins p5 2.3.3, p5.brush 2.2.3 and puppeteer-core 25.16.0. CI installs with lifecycle scripts disabled.
- `index.html` only adapts dependency paths. Google Fonts supplies Permanent Marker as in the original studio.
- New `scripts/smoke.mjs` uses the runner's official Chrome with its sandbox retained. It verifies actual WebGL2 readPixels, metadata, and visible original frames. No unsafe SwiftShader opt-in, GPU blocklist override, sandbox-disable flag, kernel/device permission change, secret, or paid runner is used. Chrome may automatically select its built-in software renderer.

## Rendering and QA

`Sandbox WebGL2 and original frames` checks the runtime before full rendering. The opening frame intentionally has a closed iris, so visible-content checks use 0.5, 6 and 11.8 seconds.

`Render original 12-second animation` renders six disjoint 48-frame sections on standard GitHub-hosted Ubuntu runners: **1920×1080, 24 fps, 288 frames, 12 seconds**. The original timeline specifies pure time-based frames; every frame resets random/noise seeds. Adjacent jobs also draw an identical overlap time, compared by SSIM for diagnostic review; a score below 0.98 requests visual review, not automatic rejection. Browser readback noise alone is not a rendering failure.

Each section is encoded once with identical H.264 parameters (CRF17, limited-range BT.709, yuv420p). Assembly stream-copies the sections and original-source rebuilt AAC. It does not re-encode the picture. Frame count, fps, dimensions, audio format, duration, full decoding are required gates; overlap similarity is diagnostic. Visual QA still remains a separate human/assistant inspection of final contact sheet and first/middle/end stills.

Only compressed video sections, key frames and verification manifests are uploaded as short-lived Actions artifacts, not the complete PNG sequence. No paid storage or runner selection is configured.

## Sound

See `AUDIO-REPRODUCTION.md`. `bash scripts/build-audio.sh` generates original Foley, music and mix from source with pinned NumPy/SciPy. The technical limiting ceiling is adjusted to -1.911 dBTP per upstream's retry method; arrangement/timing stay unchanged. This is a source reproduction, not a claim of byte identity with the author's release soundtrack.

## Local cloud development

`npm ci --ignore-scripts --no-audit --no-fund` then `npm run smoke` on an authorized Linux cloud machine with standard Chrome. Full rendering is gated by `RENDER_FULL=1`, with optional `FRAME_START`/`FRAME_END` bounds. No use of the user's local computer is authorized by this repository.
