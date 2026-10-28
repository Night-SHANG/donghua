# Official huashu examples: unchanged reproduction

## Two source excerpts

Fixed original checkout: `alchaincyf/huashu-art-motion@8a0d7d72ca65fcce6f8ba82c4a6c8dfe35b8422c`.

1. **Styles — `film=gallery`, global 9–21s (12s).** The existing `scripts/engine/eras_gallery.js` contains 35 scenes. This excerpt starts at the end of Renaissance, then includes Rembrandt, ink, impressionism, pointillism, post-impressionism, Munch, nouveau, Monet, Picasso blue and Klimt. Original timing, camera, materials, colors, counters and transitions are retained; no 1-second scene is stretched to twelve seconds.
2. **Acting/continuous style crossing — `film=demos/long_scroll`, global 3–15s (12s).** Existing `scripts/engine/demos/long_scroll/eras.js` loads Egypt, Monet and 8-bit. Read-only timeline derivation from `world.js` and segment constants: Egypt ends 4.558571s; Monet ends 10.457857s; whole demo 15.629286s. The selected excerpt shows both crossings, Monet's complete stone-skip interaction (starts 5.915714s), and the pixel block-hit/celebration (interaction starts 12.065s). These are static source-derived timings, not yet measured rendered timings.

The long-scroll characters belong to the skill author's bundled demonstration. This reproduction is explicitly **that official demonstration**, not our original film or authorization to reuse that likeness elsewhere. Upstream README's character exception and font licenses remain applicable. No original audio is bundled with these demos, so outputs are deliberately silent; we do not fabricate replacement music or narration.

## Local source evidence inspected

Under `/tmp/animation-trials/huashu/skill/scripts/engine/`:

- 45 declared font files and all 22 static index scripts exist.
- All 35 gallery scene files exist; all 34 referenced transition names are registered in original `transitions.js`.
- Six long-scroll frame-library metadata files point to 48 PNGs. Every image was found and read-only decoded/verified using Pillow; total PNG bytes 1,858,976.
- Local upstream HEAD matches the pin and tracked status is clean.
- `reference_films/spacex/README.md` explicitly says it is an incomplete code snapshot; not used.

## Minimal native invocations (not yet executed here)

After installing Playwright + Chromium and ffmpeg in the authorized cloud runner:

```sh
python upstream/scripts/engine/render.py --film gallery \
  --from 9 --to 21 --fps 60 --width 1920 --height 1080 --crf 14 --out gallery-native.mp4
python upstream/scripts/engine/render.py --film demos/long_scroll \
  --from 3 --to 15 --fps 60 --width 1920 --height 1080 --crf 14 --out long-scroll-native.mp4
```

Do not render the fixed-layout long-scroll canvas directly at 1280×720: its world constants use 1920×1080. The workflow renders original-size **1080p60 first**, then explicitly makes a **720p60, two-pass 5Mbps review derivative**. Both clips must decode to 720 frames/12 seconds. The master checksum/probe remains in the evidence, while the master itself stays temporary to keep uploads small.

## New paths to commit

- `.github/workflows/huashu-official-examples.yml`
- `huashu/tools/official_examples.py`
- `huashu/official-tests/test_official_examples.py`
- `requirements-huashu-official.txt`
- `HUASHU-OFFICIAL-REPRODUCTION.md`

The independent workflow accepts `feat/huashu-fox-stork`, `render/huashu-official-examples`, and its suffixed branches, but only these new workflow/helper/test/requirement paths trigger it. It does not edit or invoke the fox/stork workflow, composite setup, overlay, audio, config or character tests. The old wrapper is not reusable unchanged: it rejects `demos/` film IDs, requires a custom overlay, and its composite runs fox-specific tests.

## Verification and artifacts

Two standard `ubuntu-22.04` jobs run in parallel, contents-read permission, no credentials besides standard read-only checkout, no paid models/runner, no remote write by helper. They fetch the exact public upstream SHA and verify clean source before and after. Each uses only upstream native `render.py`, rendering selected stills, the twelve-second movie, and two repeated source stills from fresh browser launches for a narrow determinism check.

The upload contains the 720p review movie, six JPEG stills, full probe data, runtime/tool versions, run/commit provenance, all engine source-file SHA256s, native master hash, two sampled source-PNG comparisons, logs, license and `SHA256SUMS`. Each artifact has **1-day retention** and a strict **<14,000,000-byte total** guard, including failure diagnostics. Past files/artifacts/history are untouched.

These checks do not assert complete every-frame determinism, artistic approval or complete native QA. Original blue/purple colors and original timing are never changed just to satisfy a heuristic film gate. The task is to show faithful upstream output first.

## Checks actually run during preparation

Five orchestration unittests passed, including a real ffmpeg/ffprobe 60fps decode/frame-size/count test. Upstream pin and actual static dependency preflight passed. YAML static assertions passed for the two-matrix jobs, read-only permission, independent setup, upload-size guard and 1-day retention. **No browser/example video render or remote operation was performed by this preparation worker.**
