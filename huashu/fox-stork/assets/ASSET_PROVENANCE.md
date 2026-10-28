# Fox & Stork — original generated artwork

Created 2026-10-28 in the authorized cloud workspace, using **built-in `image_gen.imagegen` only**. No third-party paid image/video API, borrowed character pack, reference-film actor or external sample was used. These are agent-reported tool-call records, not a platform-signed model-origin attestation. Tool interface did not expose an underlying model identifier.

## Art-direction decision

`source/three-directions.png` (2172×724 RGBA) contains three distinct compositions of the same dinner reversal: wide stage-like gouache/cut-paper; elevated relief-paper diorama; intimate drybrush close-up. User explicitly delegated the choice, so the first composition was selected internally. `selected-direction.png` is a technical crop used as visual reference for subsequent calls.

The locked characters are original adult cartoon animals: russet-orange fox, cream muzzle/bib/tail tip, dark-brown paws, expressive brows and eyes; ivory-white stork, charcoal flight feathers, long narrow terracotta-red beak and legs. Neither wears clothing. Same axis throughout: fox faces right, stork faces left.

## Real generation calls and files

| Call | Purpose | Local project result | Alpha |
|---|---|---|---|
| 1 | Three-composition direction contact sheet | `source/three-directions.png` | RGBA, genuine transparency |
| 2 | Eight fox performances | `source/fox-sheet-v1.png` | RGBA, genuine transparency |
| 3 | Eight stork performances | `source/stork-sheet-v1.png` | RGBA, genuine transparency |
| 4 | Empty woodland courtyard environment | `source/woodland-background-v1.png` | Opaque background |
| 5 | Two framing branches and two individual oak leaves | `source/foliage-sheet-v1.png` | RGBA, genuine transparency |

Exact prompts for all five calls: `source/generation-prompts.json`.

The built-in tool sometimes returns an inline data URL without an output path. For calls 1 and 5, its returned PNG bytes were materialized via base64 decoding; the file was not recreated or guessed. Other calls were copied from the actual generated-images path in the tool result. Originals remain preserved; project-bound copies are listed here.

## Runtime assets

- `characters/{fox,stork}/{pose}.png`: 16 transparent PNGs.
- Same-name `.webp`: **lossless**, pixel-equivalent to PNG including alpha, verified by decoding and comparing every RGBA pixel. About 75–156 KB per pose.
- `characters/manifest.json`: exact crop/dimensions, fixed actor reference height, source-pixel-derived anchor measurements, hashes, transparency fractions and encoding verification.
- `environment/woodland-background-runtime.webp`: 1672×941, 382,702 bytes, q80; selected after testing descending quality 96→80 to stay below 400,000 bytes. Visually reviewed, full-resolution original and lossless copy retained.
- `environment/{branch_left,branch_right,leaf_gold,leaf_curled}.webp`: isolated true-alpha foreground/leaf sprites, lossless; optional for native branch pivot and deterministic leaf flight. Their stem pivots are in `environment/manifest.json`.

## Technical slicing and transparency verification

The generated sheet spacing is not perfectly equal-grid: fox tails and hands cross nominal column borders. Therefore `source/slice_sprites.py` identifies the eight independent alpha-connected components instead of cutting four rigid columns. It preserves source RGBA values over each silhouette plus a three-pixel antialias fringe and adds transparent margins. No character was hand-painted, redrawn or generatively altered by code. Fully transparent hidden RGB is canonicalized to zero for predictable encoding. `source/slice_foliage.py` uses the same technical extraction method.

The original sheet preview may misleadingly display hidden orange/brown RGB despite alpha zero. This is **not** an opaque background. On the fox source sheet, exactly alpha-zero pixels occupy about 58%; sampled gutter `(384,512)` is `[84,49,27,0]`. Both character sheets yielded exactly eight independent large alpha components. Runtime transparent pixels have zero RGB.

Actual beige/gray-background QA contact sheets: `source/fox-qa-contact.jpg` and `source/stork-qa-contact.jpg`. Every sprite was visually checked there for complete tails, wings, bill tips, hands and feet with no remaining background or chopped silhouettes.

## Animation contract

- Fox fixed source `ref_h = 465`; stork `ref_h = 478`.
- Compute scale from the actor's fixed `ref_h`, **not** each cropped sprite's height; lowered-head poses must stay physically the same size.
- Position `anchors.feet` at the world ground point. Frame changes must not move the ground point.
- `anchors` are local pixel coordinates; `normalized_anchors` divide by the individual sprite dimensions.
- Fox provides `mouth`, `nose`, `head`, `paw`; lapping/tongue poses additionally `tongue_tip`.
- Stork provides `beak_root`, `beak_tip`, `head`, `wing`.
- Measurements are visual estimates against actual source pixels, approximately ±3 pixels, not claimed computer-vision landmarks.
- Keep dishes/vessels separate. Bind them to verified mouth/beak landmarks and composite front rims in front of inserted bill sections. Foot and contact corrections still require rendered scene QA; the sprite manifest is not proof that a film's contacts are correct.
- No actual frame-to-frame skeletal animation is embedded in these assets; the native deterministic animation implementation supplies motion, transitions, prop contact and occlusion.
