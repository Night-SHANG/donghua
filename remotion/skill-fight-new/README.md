# 抢铃 / Bell Duel

A new 20-second, 1920×1080, 30 fps Remotion cartoon fight. Two courtyard rivals exchange parries, counters, low/high kicks and an aerial counter-kick. A final palm sends the rival into a padded post, accidentally ringing the bell. The victor pauses and bows. No dialogue is required.

## Reproduction

`npm ci`, `npm run typecheck`, `npm test`, `python audio/generate.py`, then `npm run render` using `render-plan.json`.

## Skill use and limits

- nispa/stickman-video: MIT Figure, forward kinematics and pose representation reused. Procedural walk/run cycles were deliberately NOT reused: their knee sign convention did not fit a side-facing character. This film uses explicit negative relative shin flexion, two-bone solving, persistent world foot plants and angular kick arcs.
- cstack animated-video: cause-and-effect beat sheet, independent anatomy/temporal review and script-blind story check.
- cinematic-camera: one courtyard coordinate space, shared focal/zoom track, action-directed holds and stable ending. Product-specific authenticity/Instagram scoring is inapplicable to a fictional cartoon; no score is fabricated.

Music and Foley are original synthesized audio. No user reference footage/screenshots are included in this repository. See THIRD_PARTY_NOTICES.md for MIT attribution.

This is an authored cartoon, not motion capture or a physical dynamics simulation. Tests establish numeric continuity and contact envelopes; artistic quality requires actual picture and motion review. Review findings are recorded separately and do not imply user approval.

The stone bench is background furniture at a separate depth baseline, not a collision obstacle. The film does not claim a physical bench vault. The padded bell post is the contacted environment object.
