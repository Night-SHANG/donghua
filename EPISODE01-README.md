# 《这屋我说了算》01《安静一点》

原创 p5.brush 手绘代码动画，扣扣／溜溜为用户确认的 r3 固定角色。32 秒，1920×1080，24 fps，原创合成配乐与音效。保留 ClaudeAnimationBase 引擎与原许可证；没有用位图生图或 SVG 静帧替代实际绘制。

- 入口：`episode01.html`，浏览器必须支持 WebGL2。
- 完整分镜与验收记录：`film/house-comedy/episode-01/`。
- 实际画面：`src/episode01/story.js`；角色：`src/cast/duo.js`。
- 声音：`python scripts/episode01/build_audio.py`；32 秒两声道48kPCM，22–24秒真实静音。
- 锁定依赖：`npm ci --ignore-scripts --no-audit --no-fund`，使用现有 npm lock；默认浏览器沙盒，不能加不安全启动参数。
- 预览：`RENDER_STAGE=preview node scripts/episode01/render.mjs`，取 `render-request.json` 中 times，不把所有关键帧连续轮播冒充影片。
- 全片：`.github/workflows/episode01.yml` 的 16×48帧；每份额外输出后一帧用于拼接边界核验。
- 合成：已有 FFmpeg7 环境运行 `python scripts/episode01/assemble_local.py <parts> <output>`，流复制视频，不做第二次视频编码；逐轨32秒与768帧验收。
- 视觉证据：`python scripts/episode01/review_final.py <final.mp4> <review-directory>`，从真正已编码的视频提取按时间排序的帧，而非展示另一套样板。

本说明为复现入口；是否最终交付通过须看 `DELIVERY.md` 和对应 QA/probe，不以本文件代替成片证据。
