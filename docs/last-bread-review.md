# 《最后一个面包》5秒动作试片 — code-ready, visual approval pending

## Scope
Only16–21s of the chase is implemented: run → crouch → reach/miss → planted brake → sparrow catches up. `LOOPS.breadPilot` maps0–5s to that interval. The full60s/eight-shot film is deferred; the runner refuses the unimplemented full route. User review of actual continuous pilot is still required.

The approved concept was viewed before implementation: gray-brown raccoon, dark mask/cream face, teal apron/ringed tail; chestnut sparrow with cream breast and oversized folded-paper hat. Five-view silhouettes and articulation remain, with the requested art correction making the raccoon14%wider and10%shorter around its ground origin. No concept texture sliding substitutes for articulated geometry.

## Reproduce
- `node --test` — all new contracts plus real media integration fixtures (requires ffmpeg/ffprobe and pinned Python audio deps).
- `BREAD_PNG_ONLY=1 node --test tests/last-bread/{characters,runner}.test.mjs` — views path excludes AAC integration.
- `node scripts/render-last-bread.mjs --loop breadViews --out out/last-bread` — ten selected stills. Only PNG views: no audio/video preflight.
- `bash scripts/build-last-bread-audio.sh` — original5s synthesized score,33 sound cues exported from named motion events; outputs under ignored `film/last-bread/audio/`.
- `node scripts/render-last-bread.mjs --loop breadPilot --start 0 --end 120 --out out/last-bread` —120 continuous frames plus separate diagnostic boundary120, using film metadata.
- `node scripts/encode-last-bread.mjs out/last-bread film/last-bread/audio/mix-aac.m4a` — only accepts complete continuous pilot manifest; H264/yuv420p/BT709 + AAC48k stereo; asserts120frames/5s and full decode.

Browser must be official `/usr/bin/google-chrome` with normal default launch args `[]`, sandbox retained. WebGL2 clear/readPixels must pass before loading the scene. No fallback, custom GPU arguments or local-user-computer execution. A free ubuntu22.04 workflow listens only on dedicated `render/last-bread-pilot` branch + exact request file; each views/pilot stage is explicitly requested. No automatic progression or full-stage option.

## Grounding and pure-time controls
`Bread.sample(t)` uses existing kf/spring/arcPt with independent root/arms/gaze/tail/hat/parcel tracks. Explicit world-space foot targets are inverse-affine mapped into real leg geometry: foot vertices and returned anchors coincide under body rotation/squash. There is no IK engine. Stance feet stay fixed while roots advance; swing feet travel on arcs. Front right raccoon foot remains locked through deceleration. Default anatomy still uses the original phase-driven geometry when targets are omitted.

Automated tests measure actual geometric stance vertices during the run, not only frozen brake. They also check all121 sampled states finite/reverse-order deterministic, continuous event-boundary controls, wrapped parcel independence/near-miss separation, support compression, secondary lag and final root-velocity convergence. These are technical checks, not proof of appealing animation or paper texture.

## Sound evidence
Original score and procedural effects use the existing music/sfx/mix toolchain, not the previous film's score/audio. Cues derive timing and pan from production JS named events. Build checks the versioned generated event JSON against that source.

Local decoded AAC result (ffmpeg7.1.5):5.000s, stereo48k AAC,−14.1003LUFS integrated,−2.1095dBTP, full decode PASS. Initial WAV ceiling−2.2dBTP produced decoded AAC−1.046dBTP and correctly failed; WAV source ceiling−3.0 supplied measured codec headroom. Final mux is measured again. Listening review remains pending. These measurements do not predict byte-identical Ubuntu4.4 output; the same gates run there.

## Required controller review
1. Actual p5 views: recognizable illustrated silhouettes, face readability, folded hat, rear views, teal apron and ringed tail. Nothing here asserts raster approval.
2. Continuous5s at normal speed, then takeoff/miss/landing/brake/bird-arrival stills: check weight, contact, no foot sliding, expressive miss, and smooth hat/tail lag. Fix action before using sound to distract from defects.
3. Listen with picture: footstep density, dry cloth/paper sounds, miss/landing accents, room for the bird's arrival. No dialogue.
4. Inspect runner manifest: startup/per-frame median/p95/max, sampled process-tree RSS and Node peak. Projected chunk upper bound is `1.3*(ceil(1440/chunks)*p95 + startup + encode)` only a budget estimate, not authorization for full render. Actual pilot has no segments.
5. Show reviewed pilot to the user. Stop before Task3–5/full film until approval.

## Runtime notes
The first safe Actions views attempt stopped before Chrome: old distribution ffmpeg omitted AAC when simultaneously encoding a one-frame video. Views now do not depend on AAC; pilot preflight separately encodes/probes/decodes silent AAC then copy-muxes it, following the original known-good workflow pattern. Bootstrap failures retain diagnostic manifests. Actual p5 views were rendered and inspected: median5.04s/frame, p95~7.09s, startup15.27s, peak sampled process-treeRSS~1.54GiB. They failed concept fidelity (translucent collage, pale features, incorrect rear bib/beak visibility). The art correction now removes hidden rear geometry, supplies opaque silhouette underpaint plus restrained watercolor overlay, strengthens ink/legs and rounds the raccoon. A focused front/side/back rerender is still pending; neither this correction nor the pilot is visually approved.


## First actual raster review and authorization record (2026-10-28)
Safe views run [40628915374](https://github.com/Night-SHANG/donghua/actions/runs/40628915374), source`fc5677c`, produced10PNG frames. Measured median5039.43ms, p957085.30ms, max7085.30ms, startup15269.93ms; peak sampled process-treeRSS1617392KiB. Technical raster rendering succeeded, but visual review **failed**: translucent overlapping anatomy/gray-white patches, rear teal front bib and hidden beak showing through, weak dark facial features/bird legs and a tall/narrow raccoon. These findings are preserved; the corrected front/side/back PNG subset remains unreviewed.

The correction removes the truly hidden rear bib/beak, uses a flushed opaque p5 underpaint followed by restrained watercolor rather than treating pigment wash as opacity, strengthens outlines and bird legs, and rounds raccoon proportions. The sparrow now consistently draws in the foreground so the opaque tail cannot cover its catch-up reaction. Parcel support is derived from the exact rotated production polygon and the slope, then the independent hop is applied; no proxy circle or new solver.

2026-10-28用户已明确批准本片源码/测试/文档/workflow公开持续写入donghua和标准免费pilotActions；full仍待用户看短段。
