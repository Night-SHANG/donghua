# Continuous stick fight

An original paired-action film built from licensed whole-body movement, a shared interaction timeline, independent actor source clocks, fixed skin landmarks, and a deterministic Remotion/SVG renderer.

## Status
Internal work in progress. Numeric tests, an encoded preview, and an artistic review are separate gates. Do not treat this README or generated reports as a release approval.

## Local cloud workflow

```sh
python scripts/build_motion.py
npm run typecheck
npm test
node --import tsx scripts/preview.ts --stills --small
node --import tsx scripts/preview.ts --small
```

The local preview uses resvg and FFmpeg, not Chromium. Official Remotion rendering is handled by the separately reviewed cloud host scripts after the parent approves the release gate. `src/poses.json` supplies actual frame count; a release must bind it to `film-spec.json` and the audio duration. Review artifacts include motion-data and visual-source hashes.

## Appearance and movement
- Classic thick opaque stick silhouettes, circular heads, no debug skeleton joints or finger branches.
- Head center uses the midpoint of BVH `Head` and `Head_end`; virtual fist center is 0.4 along `Hand` to `Hand_end`, when declared in pose metadata.
- Camera projection is fixed at 30 degrees. Alternate-angle studies are private diagnostics, not camera changes in the film.
- The native BVH hierarchy and fixed offsets are preserved. Whole-body rotations are interpolated; no independently interpolated Cartesian hand targets or fixed-branch endpoint IK.
- Paired root staging is kinematic, not a physical simulation. Support drift, all-frame global bone angular speed, contact windows and actual silhouettes must be reviewed explicitly.
- Environmental geometry is fixed in world space from the first frame. No prop is spawned at an impact to manufacture contact.

## Licensed sources
ACCAD Motion Capture Lab / The Ohio State University, Open Motion Project, Male2 BVH archive. Creative Commons Attribution 3.0. Adapted by selecting active windows, resampling, staging, editing whole-body transitions and rendering stylized silhouettes.

- https://accad.osu.edu/research/motion-lab/mocap-system-and-data
- https://creativecommons.org/licenses/by/3.0/
- Original archive SHA-256: `f30dc56f8557d4b9f1bd6b8b0c4218c076471de0a9c1a20f3bc4a8b776cc14b1`

Optional terminal reaction: Quaternius Universal Animation Library 2 Standard, `Hit_Knockback`, CC0 1.0. Fixed-rest-axis retargeting to the ACCAD hierarchy; the small derived reaction is licensed source material, not original capture. Its presence is declared by `terminalReaction` in the pose metadata.

- https://quaternius.com/packs/universalanimationlibrary2.html
- https://quaternius.itch.io/universal-animation-library-2
- https://creativecommons.org/publicdomain/zero/1.0/

All drawing code, choreography configuration and generated score are original project work. User-provided reference films and screenshots are private research only: **never include them in release manifests, source archives or public repository commits**.
