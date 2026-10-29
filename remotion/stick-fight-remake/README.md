# EXIT — 15-second classic stick fight

A complete original short scene: two fighters contest an industrial passage, trade blocked punches, a spinning kick damages the lock cabinet, one uses the opened left exit, and the gate locks again. Native whole-body motion, classic solid heads / round limbs, original environment and synthesized original score / effects. Non-graphic.

## Reproduce

Node22, Python3.11. Install package-lock via npm ci; install numpy2.2.6 and scipy1.15.3.

```
python scripts/export_motion.py
python audio/synthesize.py
cp audio/master.wav public/audio/exit-fight.wav
npm run typecheck
npm test
python -m unittest discover -s audio -p 'test_audio.py'
node scripts/render.mjs
python scripts/verify_output.py
```

The source-only package excludes raw motion ZIP and user-supplied films/screenshots. Generation downloads the official ACCAD archive and checks its pinned hash. `src/poses.json` is derived at build time. Rendering is Remotion4.0.534; local resvg is an internal exact-SVG preview, not a substitute claim that Remotion rendered locally.

## Authored timeline at60fps
- 0–41: locked control insert.
- 42–146: native CrossLeft8–60 against BlockRightMiddle9–61; contact74.
- 160–264: same complete pair rigidly reversed; return block192.
- 265–299: control insert for the intent / stance change.
- 300–468: native SpinningBackKick plus DodgeRight; foot contacts cabinet382, not the rival.
- 398–498: gate unlocks and retracts.
- 468–521: gate insert; a turn occurs off-camera, no invented visible turn animation.
- 522–676: native ReadyToRun, facing left away from rival, retains full captured root travel.
- 718–818: gate closes and relocks; opponent lowers guard using native ReadyToRelax.
- End900:15seconds. No diagnostic overlays.

Whole local rotations are quaternion-resampled and blended only between authored clips. No IK/contact snapping. Both performers share a stable native rig; no independent Cartesian limb manipulation. The off-camera stance/turn joins are film ellipses, not claims of physically foot-locked transitions. A modest defensive lean is not sold as an extreme evasive stunt.

## Quality evidence and limits
Tests check whole-film samples, exact cue types, retained root travel, camera/rigid-transform equivalence, classic skin topology, constant bone lengths and orthonormal rotations. Separate visual review checks actual projected contact and joins; numerical passing is not proof of artistic quality. Native-rate playback should be assessed from the delivered film.

Motion attribution / CC BY3.0: see [docs/ATTRIBUTION.md](docs/ATTRIBUTION.md). Source provenance is generated in docs/motion-provenance.json. Original code/audio rights are separate from third-party motion attribution.
