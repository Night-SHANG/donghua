# Stick Duel Implementation Plan
Goal: coherent original12second duel.
Architecture: motion.ts owns deterministic keyposes, shared-joint two-bone IK, events and camera. Scene.tsx renders continuous strokes, historical trails, event effects. Validated Remotion host reused with pinned dependencies, ffmpeg preflight, preview guard and always artifacts.
Spec: DESIGN.md
Global constraints:12s60fps720frames; no independent limb transforms; no copied reference footage/audio; no remote writes until parent approval.
Review focus: feet sliding, stretched limbs, contact misses, unreadable silhouettes, camera cropping. Tests cover allframes jointlengths/finitebounds, authoredevent contacts, stancefootlocks and effect-free composition.
1. Write failing motion tests; implement shared skeleton and keypose interpolation; verify suite.
2. Build visible scene and local SVG raster stills; analyze representative attack/landing shapes; independent review.
3. Integrate original event-synced audio, typecheck/tests/preflight; CIpreview and independent denseframe review before final.
