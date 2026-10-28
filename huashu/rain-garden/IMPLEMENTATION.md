# Native implementation evidence
- Completely read upstream `lib/paint.js`, `lib/camera.js`, `scenes/28_monet.js` for the implementation. No character art, raster poses, Remotion or image warping.
- Actual reused APIs: `PAINT.cached`, `PAINT.grain`, `CAM.at`, `CAM.with`, `U.rng`, `U.clamp`, `U.lerp`. Deterministic textured water-stroke and ellipse-wave approach adapted from Monet scene; all compositions and plant geometry new.
- Native `ERAS` four-shot registration; all shot draw functions call one continuous global-time world. Camera is logarithmic zoom and smooth keyed position. No state mutation on shot entry.
- Leaf tip and water impact share x=1000; release y=350, contact y=620 at3.8. Hero drop vanishes only at impact, splash particles originate exactly there.
- Flower petals are connected Bezier contours rooted to a common moving pad. Their transformations do not split images or change identity.
- `tests/test-state.js`: 901 deterministic global samples, exact15s, impact and camera continuity assertions pass. This does NOT prove beauty, visual continuity or perceptual smoothness: those remain actual render checks.
- Key visual risks to inspect: waterdrop overlap at3.8, flower cup readability, island full framing at15, overall balance of darkness/gold highlights.
