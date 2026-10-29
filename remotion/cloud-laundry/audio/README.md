# 云朵洗衣店：原创配乐与音效

30 秒，48 kHz，16-bit stereo PCM。80 BPM，10 小节，D 大调音色与轻微 B 小调过渡。柔和敲击琴主旋律、低音和弦、细碎琶音、缓入气垫和小房间反射。配乐不是两个 15 秒段落重复，结尾单独写了终止式。

- `master.wav`：成片混音。
- `music.wav` / `foley.wav`：可独立调节的音乐和动作音效。
- `cues.json`：与导演确认的时间点。
- `synthesize.py`：固定随机种子的原创合成器；仅依赖 NumPy 与 SciPy。
- `test_audio.py`：时长、双声道、峰值余量、首尾静音、非重复、非空白检查。

执行：`python synthesize.py && python -m unittest discover -v`。

技术检验：7 项通过；重复生成 SHA256 一致；ffprobe 为 30 秒双声道 48000 Hz PCM s16le；FFmpeg loudnorm 测量输入 -18.14 LUFS，true peak -4.55 dBTP，LRA 3.30 LU。未执行实时主观听音，不能把技术检查表述为听感验收。

全部音符、包络及音效由本次任务编写合成，无外部录音、样本、歌曲或第三方素材。未使用收费生成服务。可随本动画源代码一同备份。

镜头修订：挤压提示改为 8.7 / 9.1 / 9.5 秒；主水滴仍在 12.6 秒。修订后的 master SHA256：b892583571ba0e8afa8154e29cc9d7ba52f5cf1271ec162ca00b9f25b3683759。
