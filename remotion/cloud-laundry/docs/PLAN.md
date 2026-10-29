# Cloud Laundry Implementation Plan
Goal: deliver cohesive30s Remotion film.
Architecture: frame-pure motion.ts defines continuous world anchors and five camera states; Scene.tsx combines painted plate with SVG deformed hero/props and lighting. Root registers composition. Original audio static asset.
Spec: DESIGN.md
Constraints:60fps,1800frames,1920x1080; no async random/CSS animation; no remote writes.
Review focus: cloud silhouette continuous; brass front/back occlusion; watering lands on pot; cloth attached to fixed pin coordinates; frame boundary camera cuts intentional.
1. Write motion tests, observe fail, implement frame state and geometry. Tests check all1800frames finite, continuity away from deliberate cuts, event timing and fixed anchors.
2. Add scene and host; typecheck; render representative stills and dense transition samples. Review compositing at every shot.
3. Integrate audio, render full MP4 locally, ffprobe/full decode/black detect, independent visual review.
