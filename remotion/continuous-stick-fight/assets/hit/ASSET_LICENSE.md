# Retargeted terminal motion asset

`hit_knockback.npz` derives from **Quaternius Universal Animation Library 2, free Standard**, clip `Hit_Knockback` in `UAL2_Standard.glb`.

- Official page: https://quaternius.com/packs/universalanimationlibrary2.html
- Official download listing: https://quaternius.itch.io/universal-animation-library-2
- Original free Standard ZIP contains an explicit CC0 license; copied without modification into `Quaternius-CC0-License.txt`.
- License: CC0 1.0 Universal. https://creativecommons.org/publicdomain/zero/1.0/
- Generated asset SHA256: `e15f809f932c2a9bd23c3efb721e01fef2b5775e6e993059852fc162ab9b9eb5`.
- Adaptation: retargeted by fixed anatomical outgoing-bone calibration to the ACCAD skeleton proportions, native local rotations reconstructed from source world rotations,60fps resampling, native root translation scaled by measured leg-length ratio. No source script executed.
- Final film uses sourceframes8–50. A16-frame GLOBAL rotation static-pose bridge and authored post-impact horizontal impulse are **additional choreography**, not present in the downloaded capture. Native vertical fall retained. These changes are documented in `docs/MOTION_ENGINE_HANDOFF.md`.
- This small generated NPZ is sufficient for deterministic film regeneration with `scripts/build_motion.py`; the renderer does not require source GLB, paid source files, network downloads or external absolute paths.

The ACCAD target skeleton / other source motion remains separately attributed under CC BY3.0, per projectcredits. CC0 source status does not remove attribution obligations on the rest of the film.

`Death_A_grounded.npz` in this working folder is a rejected diagnostic and **not used in the released animation**. Exclude it and its metadata from release manifest unless preserving internal research artifacts is intentional.
