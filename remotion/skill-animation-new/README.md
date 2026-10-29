# 风借走的帽子 / The Hat the Wind Borrowed
A new wordless24-second autumn cartoon. One golden hat is lost to wind, pursued, and voluntarily left as a bird's shelter. A falling leaf becomes a new hat.

- ActualRemotion composition: HatBorrowed,src/index.ts. film-spec.json is the output contract.
- `npm ci`; `npm run typecheck`; `npm test`.
- `python audio/generate.py` creates the original24-second master track at public/audio/master.wav. Do not mix the stems over the master.
- `node scripts/render.mjs` performs the host-selected render mode. Full output uses30fps,1920×1080.
- Development stills in out/style are Inkscape rasterizations of the actual SVG scene, not evidence of an actualRemotion render. Final preview/output is rendered on authorizedcloudCI.
- See THIRD_PARTY_NOTICES.md for MIT engine attribution and docs for reading/production record. No user reference files are included.
