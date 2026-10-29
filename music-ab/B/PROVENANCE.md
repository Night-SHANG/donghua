# B：纸上的春天 / Living Paper

## 实现与来源
- 使用 huashu-art-motion **原生 Canvas engine.js、render.py、util.js、paint.js、brush.js、transitions.js 和 scenes 加载器**，不是重新命名的 Remotion 或静态幻灯片。
- 上游：https://github.com/alchaincyf/huashu-art-motion
- 锁定提交：`8a0d7d72ca65fcce6f8ba82c4a6c8dfe35b8422c`。
- 上游代码 MIT，完整许可随 `engine/LICENSE.huashu` 保留。
- 画面和场景脚本 `engine/scenes/rise.js` 原创；借鉴 `30_matisse` 中 PAINT.cut 手剪边、种子随机水粉纹理、纸投影、根部摆动机制，没有复制例图房间、人物、海报或名作构图。
- 未使用受限花叔形象、Clawd、角色帧库、字体或任何第三方图像。没有歌词，没有用户音频文件或 URL。

## 已完整阅读的技能及实做资料
`SKILL.md`，`05-节奏与配乐.md`，`镜头语言.md`，`镜头表模板.md`，`风格配方/INDEX.md`，`28_monet.md`，`09_postimp.md`，`30_matisse.md`，`15-跨场景风格提炼.md`，`_转场_迁移测试.md`；实际 `30_matisse.js`、engine、render、brush.cut、场景加载和转场代码。
新版强调全片一套画风，因此选择成熟剪纸材料路线，不同时拼贴莫奈/梵高/马蒂斯。沿用其材料机制，不声称艺术家忠实度达到任何星级。

## 渲染
```
pip install playwright
playwright install --with-deps chromium
python engine/render.py --fps 30 --width 1280 --height 720 --from 0 --to 30 --crf 17 --out B-silent.mp4
```
无声成片 1280×720，900 帧，30秒。音频由父任务仅在私有工作区使用共同音轨合成，两版使用同一段、同增益、同淡入淡出。不在公开仓库放音频。

## 相对上游的工程调整
- 渲染器去除不必要的 `--disable-web-security` 等 Chromium 开关；使用同源本地 HTTP。
- FFmpeg 退出码非零立即报错，避免把失败编码报告为完成。
- 最小依赖复制，不包含示例角色/全部风格库；无字体需求。
- 场景使用 1920×1080 设计坐标，按实际画布缩放，已测 1280×720。
- 自定义 leafOpen 与 ridgeWipe 物理转场；沿用 sunShaft 暖光转场。

## 当前验证（2026-10-29）
- 镜头表 lint：8镜全绿，30秒，零文字主导镜头。
- JS/Python语法通过。
- @napi-rs/canvas 直接运行真实 engine.js：完整 boot、17个跨镜及转场帧，无运行错误。
- 所有17帧反序重新绘制 SHA256 一致（确定性）。证据 `qa-stills/engine-validation.json`。
- 查看真实代码静帧后增大开场种子，减少峡谷前景遮挡；无生图替代。
- 这里的 native Canvas 测试不是 Chromium 成片验收，不证明正常速度流畅。正式 Chromium900帧、音画对齐、独立审片、film_gate 仍由父任务后续完成。

## 经验回流
1. `PAINT.cut` 定义在 brush.js，不在 paint.js；最小引擎不能只复制 paint。
2. `U.ease` 是缓动函数集合，不可直接调用；自定义转场用显式 smoothstep 后通过真实帧测试。
3. 全画布缩放要同时覆盖 scenes 与自定义转场；只改 canvas 宽高会裁掉原始1920坐标。
4. 不将星级卡名当作质量证据。场景内有植物生长、花瓣展开、扑翼、花粉、错速云与前景遮挡；动态是否舒适仍须真实成片审看。

## V1 → V2 动作修订
原版连续900帧 native草稿经官方 `film_gate.py` 测得快动占比0.0229（红灯），故拒绝把它作为可交付成片；不是技术运行成功就称完成。
- 幼芽从原先55%→100%改为8%→100%，让抽生的主事件可读。
- 主花冠放大至1.55倍，九片花瓣从中心依次展开，而不是小范围呼吸。
- 山谷五层从画外向上展开，随主体空间出现揭示通路。
- 飞鸟沿弧线跨画面，更明确地从植物世界进入开阔天空。
- 不增噪声、不闪屏、不抖镜，不改变官方gate阈值。V1源存 `rise-v1.js`，V1量测存 `qa-stills/film-gate-native-v1.json`；新版本重新渲全900帧，不只抽帧证明运动。
