# 泡泡吹过头 — delivered candidate

14 seconds /1920×1080 /24 fps /336 frames /H.264 BT.709 /AAC48kHz stereo.
Corrected source: e54b86062418674962c4b2b7e8a9d15509f53c35.
Actual p5 render run: https://github.com/Night-SHANG/donghua/actions/runs/40651859946
All12 rendering jobs passed. All336 times are accounted for from the same source commit; all11 overlapping boundary PNGs match exactly. The previous plant version is not the delivery.

The Ubuntu22 FFmpeg4.4 CI assembler failed the strict track-duration assertion. Its log did not print the measured durations, so the exact mismatching track was not established. Do not call this entire Actions run green. Reusing the same completed segments locally with FFmpeg7.1.5 and original generated audio produced both tracks exactly14.000000 seconds. No p5 rerender and no video re-encode were necessary. The strict checks were not relaxed.

Reproduce from downloaded part artifacts (all from the above run):
`python scripts/teapot/assemble_local.py /path/to/merged-parts /path/to/output`
Use FFmpeg7, Python +NumPy; image review additionally needs Pillow. Exact locked rendering dependencies remain in package-lock.json.

Delivered MP4 SHA256:
`a41a8a23afc60e5d24b42dad027d138795ae1c808044d8ec1bdeb7050cb62330`

Verification: bothtracks14.000000s;336frames;AAC decoded672768 samples/channel including codec padding; full audio/video decode passed; original audio synth -19.5LUFS /-2.5dBTP. No human audition claimed.
Actual final encoded frames reviewed: chronological15-frame sheet, pop/fall/lid12-frame strip, face/payoff8-frame crop, final irisframe. No obvious body deformation, detached plant leaves, crop or shard discontinuity seen. This is a short visual-comedy candidate for user evaluation, not a claim of feature-animation quality.

Process lessons: read full original style/animation guidance; same medium for character and set; review real p5frames before full render; use fixed short limbs and continuous secondary motion; use chronological sheet labels; keep rawframe artifacts separate from final MP4; freeze art after scoped feedback. Don’t equate codec checks with visual approval.

Reproduction helper was executed against all12 corrected parts; output SHA256 matched the delivered file exactly. User delivery Library reference: libfile_b40f32bbc3c881919c451b395e340c10 (17,425,901 bytes).
