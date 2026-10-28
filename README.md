# Clawd and the Leaf — reproducible rendering

Reproduction of the MIT-licensed [OpenVideoHarness showcase](https://github.com/ZLHad/OpenVideoHarness/tree/main/showcase/01-handdrawn-clawd-leaf), not a copy of its published video.

Plan: preserve original animation sources and both MIT notices; install exact locked npm packages without lifecycle scripts; test WebGL2 readback and original frames on a GitHub-hosted runner with Chrome sandbox retained; only after that succeeds render all 288 frames (1920×1080, 24 fps, 12 s), rebuild the soundtrack, encode and verify.

No local computer, secrets, paid service, unsafe GPU override or sandbox-disabling flag is used. Rendering success is not yet established.
