# Authored fight Remotion host

Status: LOCAL HOST PREPARATION, not a rendered Remotion film.

- Host restored read-only from Night-SHANG/donghua commit 56664e632491ce53c5597a9c51573471afedec5b, remotion/skill-fight-new.
- New isolated target: remotion/authored-fight; no modification to Bell Duel.
- Current data: immutable review-v11, 210 frames, 30 fps, 1280×720. Poses SHA-256 293e5366627214a7ad43acab36c08f93c9bd67691477e5d70ec1a9b5a14c119f. Director froze exact data; critic/parent production gate pending. Audio hashes bind to these exact pose bytes.
- Pose points are rendered verbatim by SVG; no interpolation, retargeting, inverse kinematics, camera shake, coordinate warp or actor scaling.
- Local contract tests: 8 passing; TypeScript and actual Webpack bundle pass. Six audio tests pass. System/bundled codec preflight actually passes. No browser render or perceptual playback has occurred.
- No public upload, push, dispatch, or publication has occurred. Parent must explicitly freeze before remote writes.
- Studio/browser not launched locally: prior sandbox browser restriction is preserved. Rendering is to use authorized GitHub Actions only.
- Preview/clean variant resolves each composition separately, and differing decoded raw pixels gate full render. Pixel extraction uses system FFmpeg (bundled FFmpeg lacks rawvideo muxer). Remux/null decode uses bundled FFmpeg with explicit codecs.
- Source validation and a successful CI do not establish natural motion, real-time rhythm, or parity with references.
