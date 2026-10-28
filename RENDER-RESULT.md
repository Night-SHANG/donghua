# Verified original-source rerender — 2026-10-28

Success: [GitHub Actions run 40618627073](https://github.com/Night-SHANG/donghua/actions/runs/40618627073), source commit `1acd48750b3f51a83fa795485d73fb4a31ce3666`.

Delivery artifact: `original-animation-1080p-12s` (artifact ID 12787396841, seven-day retention). The video is `clawd-and-leaf-rerender-1080p.mp4`, 13,257,295 bytes, SHA256 `2e8067835f79fa481aa667984702957aa7e156c2147bfcaa2897155cb3f9988d`.

## Evidence

- Official runner Chrome 155 with normal sandbox: WebGL2 context and exact test pixel `[64,128,191,255]` passed; no unsafe SwiftShader opt-in, sandbox-disable or GPU-blocklist override. Chrome automatically selected its software renderer.
- All 288 frames freshly drawn from the original scene/engine JS; no author's published video used as input.
- Six 48-frame sections at 1920×1080 / 24 fps. Same-time overlap diagnostics across all five process boundaries: SSIM **1.0** each.
- H.264, yuv420p limited-range BT.709; AAC stereo 48 kHz; container duration **12.000 s**; full decoding succeeded both in CI and after download.
- Audio rebuilt from original Foley and score. Final CI AAC true peak **−1.6288 dBTP**, local EBU loudness approximately **−14.1 LUFS**. Different ffmpeg encoder builds mean it is not byte-identical to the earlier local AAC; no claim of identity with the author's release soundtrack.
- Original audio QA run again against this final MP4: **30/30 cues**, median 7.0 ms, max 27.0 ms; five low-confidence marginal-onset warnings. No silence/dropout/pumping/click issues in the QA's default 1.00–11.96 s scan. A source-newer timestamp warning was traced to archive timestamps; score/events source SHA256 match the committed inputs.
- Actual visible frames at 0.5, 6 and 11.8 s and final contact sheet inspected. First/last closed iris and the 8.2 s near-closed transition are intentional original scene content, not blank-render failures.

## Reproducibility notes

The first full-run attempt lacked ffmpeg and failed at encoding; it was not used for assembly. Corrected workflow installs and verifies ffmpeg **before** rendering and gates parallel frames on a successful full soundtrack rebuild plus one-frame 1080p encode/mux/decode.

This is a source reproduction, not a new original animation authored here. Original MIT notices and source hashes are preserved. No user-local computer, paid runner, new secret, repository permission change or security-setting modification was used.
