# A leaf, borrowed wings — 2D Remotion edition

1920×1080, 60 fps, 900 frames / 15 s. New illustration, choreography and narrative, not old footage in a Remotion wrapper. Original SVG artwork. No remotely loaded images/fonts, third-party story or licences needed.

## Art direction
Warm handmade botanical picture-book. Watercolour-like overlapping transparent pigment shapes, thin botanical vein work, restrained paper grain, moss/sage and dusty rose → jade pond → honey parchment → ivory/silver. No titles interrupt the images. Integrated leaf palette changes by season; the single continuous leaf silhouette carries its veins, stem and frost in the same local transform (no detached character parts).

## Timeline and sound cues
- 0–3.6 spring, garden close-up: a bright raindrop descends (0.8), leaf flexes and rebounds (1.3–1.5), petals gently travel around it. Camera gently pushes into garden. Leaf arcs upward rather than travelling horizontally.
- 3.3–3.9 transition: an expanding ripple iris reveals a distinctly overhead jade water garden. Its centre is deliberately where the outgoing leaf approaches.
- 3.6–7.2 summer: overhead orbit among water lilies, leaf curves around garden centre. Dragonfly's breeze cues an accelerating climb; foreground reeds stay grounded while pond camera rotates subtly.
- 6.9–7.5 transition: diagonal turning-leaf wipe into a warm wide forest vignette.
- 7.2–11.2 autumn: golden leaf descends into an open floating book. At global9.4 the page turns upward and lends the leaf its lift; visual motion is a pause/settle followed by release, not uniform glide.
- 10.9–11.5 transition: white-paper wipe becomes snow and a quiet, differently composed winter garden.
- 11.2–15 winter: a small current curls the leaf down toward a snow-lined branch. Frost grows; leaf rests at about14.2, a tiny blush flower and green bud appear beside it. Snow continues, holding a gentle ending.

Cue sent to audio owner:0.8 drip,1.5 lift,3.6 water change,5.5 dragonfly air,7.2 warm autumn harmony,9.4 page,11.2 white air,14.2 branch landing,14.7 tail. Audio integration belongs to host, not this component.

## Implementation
- Leaf2D.tsx owns four separate named Sequence source nodes. Each scene has its own exported file/component for Studio registration. Custom reveal masks are frame-deterministic semantic transitions.
- local frame / configured fps drives all motion; no CSS animation, wallclock, state integration, random() or R3F useFrame.
- motion.ts exports leaf2DMotion(scene,t) for finite/bounds/reproducibility QA; deterministic seeded rand() drives authored decorative templates.
- paper grain is fixed seed21, intentionally subtle and original. All leaves and background graphics are actual SVG markup; no static image slideshow.
- static metadata: Spring234f; Summer252f; Autumn276f; Winter246f. Overlaps36f each, total900f.

## Validation contract
Key frames72,180,306,426,558,660,792,864. Include transition edge frames197/198/216/233/234,413/414/432/449/450,653/654/672/689/690. Check stem/veins do not detach; leaf visible, no clipped blank corners, winter rest; listen to transition correspondence. Verify encoded duration/fps/resolution/audio. Real browser/encoded-video review not yet performed by 2D author; host owns renderer and release QA.
