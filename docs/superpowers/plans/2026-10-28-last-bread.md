# 《最后一个面包》 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用现有水彩引擎完成获批双角色喜剧，先交5秒动作审片，再做约60秒8镜头。

**Architecture:** 新建独立 `last-bread.html`，按原 classic-script 模式加载原封不动的 core/timeline 与新片命名空间 `Bread`；renderer 与纯时间状态分开。复用安全 runner 的浏览器/编码步骤做新片薄适配，原12秒工程不动；不重建 IK、引擎或资源管理框架。

**Tech Stack:** p5 2.3.3、p5.brush 2.2.3、puppeteer-core 25.16.0、Node、现有 Python 音频工具、ffmpeg、GitHub Actions 标准 runner。

**Spec:** `docs/superpowers/specs/2026-10-28-last-bread-approved-design.md`

## Global Constraints
- 1920×1080、24fps；全片默认60秒/1440帧，短段5秒/120帧；H.264 yuv420p BT.709 + AAC stereo 48kHz。
- Chrome 保留 sandbox；不得用 --no-sandbox、权限扩大、禁用安全限制或 native 绕过云浏览器 WebGL2 禁用。
- 免费标准 runner；显式安装并预检 ffmpeg/ffprobe；先测时再分段，不付费、不加 secret、不改权限。
- 时间求值必须纯函数、可乱序渲染；动作、道具和声音共用命名事件，不依赖逐帧累积。
- 原案例入口、源码与原渲染流程保持可用；新片独立入口和命名空间。
- 当前仅写计划；计划审阅前不实施。后续 commit 步骤指本地保留历史提交；push/Actions/上传须核实 donghua 授权，不沿用 chache 授权。

## Review Focus
1. 任意抽帧/重试/倒序调用：同一时间的状态和画面稳定（任务1/2）。
2. 背面、侧面、快速翻身：不出现背面长眼、纸片翻转、人手鸟翼（任务1）。
3. 扑空/急停/接布：脚不滑、道具接触不跳变、不穿模（任务2/3）。
4. 跨镜头和分段末帧：无漏帧/重复帧、方向与道具状态一致（任务3/5）。
5. 重场景与尾声：运行时间可承担、末尾音效不被截掉、音画均不因编码通过而免审（任务4/5）。

## 已读源码与适配决定
基线 `cc4581c299c201e47e41a5f1abb33b6ff262f014`；实际 clone 到 `/tmp/donghua-last-bread-plan-repo`，独立 worktree `/tmp/donghua-last-bread-plan`，分支 `docs/last-bread-plan`。本次仅做既有 JS/Python 语法检查（通过），不声称重新渲染成功；npm 没有 unit-test 脚本。

- `src/core.js:1–110,186–232,275–335`：已有 kf/spring/jump/arcPt、boilSeed、paint/inkLine、camBegin/camEnd、film.frame 与 renderSheet，可直接复用。
- `src/timeline.js`：`shots([[t0, fn],...])`、`LOOPS` 支持主片与独立动作短段；镜头签名 `(t,lt,dur)`，必须整帧绘制。
- `src/clawd.js:14–45`：五个绘制关键视角与 turn 是参考模式，不把方块 Clawd 换色当浣熊。新 renderer 自己画浣熊/麻雀；不要依赖 leaf 私有 bodyPt。
- `src/scenes/leaf.js`：相机视差、动作状态与道具锚点为适配参考，不复制整部叶子片。
- `scripts/smoke.mjs`：默认 Chrome `args=[]` 已成功；但 duration=12、end=288、采样时刻、入口均硬编码，故新增薄适配脚本，不篡改原 gate。
- `.github/workflows/render.yml`：显式装 ffmpeg、预检、6段×48帧、每段额外重叠1帧、流复制合并可复用结构；不能直接把60秒塞进现有100分钟每段限制。
- `scripts/build-audio.sh` / `verify-audio.py` / `verify-video.py` 同样硬编码12秒；复用 `tools/audio/{sfx,music,mix}.py`，新增新片参数化入口与验收。

## 文件边界（均为计划新增，除注明外不改旧文件）
- `last-bread.html`：独立入口；`src/last-bread/config.js`：PROJECT 与 Bread 根命名空间。
- `src/last-bread/{characters,motion,sets,shots}.js`：角色造型/状态与事件/布景道具/镜头调度；不再按每镜头拆八套系统。
- `tests/last-bread/{characters,motion,timeline,runner}.test.mjs`：Node 内置 test + vm 载入 classic scripts，绘图调用用记录器。
- `scripts/{render-last-bread.mjs,build-last-bread-audio.sh,verify-last-bread.py}`；`film/last-bread/{events,score}.json`：新片渲染、音频与验收。
- `.github/workflows/last-bread.yml`：独立 workflow_dispatch，阶段为 pilot/full，避免 push 双触发；`docs/last-bread-review.md`：视觉/听审/性能证据。

### Task 1: 两只角色能真的转身与表演
**Files:** config.js、characters.js、last-bread.html、characters.test.mjs（均为上表新片路径）。
**Interfaces:** `Bread.drawTuantuan(pose)` / `Bread.drawJiuJiao(pose)`；`Bread.characterGeometry(species,pose)` 返回 `{layers,anchors}`，draw 与测试共用几何。Pose={x,y,u,view,flip,bodyRot,squash,legPhase,armL,armR,wingL,wingR,lookX,lookY,mood,tailAngle,hatDrop}；view 为 front/q/side/qback/back，角度弧度，位置像素。anchors 至少 feet[2]、hands[2]（仅浣熊）、beak（仅鸟）、apron[2]（仅浣熊），均为世界坐标；新片用独立形体而非复用 Clawd 身体。
- [ ] 写 `characters.test.mjs`：两角色五视角×左右朝向均产生有限几何；背面无眼层；鸟无 hands 锚点；同 pose 重复输出深相等；arm/wing/legPhase 改变相应肢体而不只改变整图位置。
- [ ] `node --test tests/last-bread/characters.test.mjs`，确认缺接口失败；实现最小分层 renderer，用原 paint/inkLine/boilSeed，种子按角色/部位命名，默认值集中声明。
- [ ] 再跑测试 PASS；建立 `LOOPS.breadViews`（len=5）姿态表，待任务2安全 runner 看正侧背及表情实帧，不把几何测试称为造型验收。
- [ ] 本地提交 `feat: add last bread character renderers`，只暂存本任务文件。

### Task 2: 5秒扑空急停验证与计算量门槛
**Files:** motion.js、sets.js、shots.js、render-last-bread.mjs、last-bread.yml、motion.test.mjs、runner.test.mjs；更新新入口加载顺序。
**Interfaces:** `Bread.sample(t)` → `{tuantuan,jiujiao,bread:{x,y,rot,wrapped},apron:{left,right,sag},camera:{cx,cy,zoom},set,shotId}`；`Bread.events` 是 `{id,t}` 列表；`Bread.drawFrame(t)` 绘制采样状态；`LOOPS.breadPilot(t)=Bread.drawFrame(16+t)`，len=5。新 runner 接受 `--loop breadPilot|breadViews`（不传则主片）、`--start N --end N --out DIR`，end exclusive；从 film 获取尺寸/fps/duration，不重复硬编码288。
- [ ] 写状态测试：16–21秒每1/24秒采样均有限；顺序/倒序状态深相等；急停支撑期间脚锚点漂移≤3px；面包始终 wrapped；扑空前后爪与面包不相黏；两角色相对速度最终收敛到0。写 runner 范围测试：5秒总120帧，非法/非整数/越界参数拒绝，额外边界帧不计入成片。
- [ ] 跑 `node --test tests/last-bread/{motion,runner}.test.mjs` 见缺实现失败；用 kf/spring/arcPt 实现分轨 root/步态/上肢/视线/尾/帽/道具；采用明确接触关键帧与锚点，不写 IK 求解器。
- [ ] 实现薄 runner 与仅手动触发 workflow：继承正常 sandbox 的 WebGL2 readPixels 预检；显式装 ffmpeg/ffprobe，先一帧 encode/mux/decode；权限 contents:read；沿用锁定依赖。输出每帧时间、峰值内存和清单，阶段只跑 pilot，不默默排全片。
- [ ] 测试 PASS 后，在有 donghua Actions 授权时生成姿态表和120帧短片；记录 median/p95/最慢帧及初始化时长，用 `ceil(1440/chunks)*p95 + startup + encode` 估计分段上限并留30%余量。超限先简化远景绘制/验证静态缓存，不扩大权限或用付费 runner。
- [ ] 连续看5秒，再抽看起跳/扑空/接地/急停/鸟赶上帧，记录概念匹配、重量、脚滑、帽尾滞后；失败修动作而非靠音效掩盖。把短段交用户审阅，通过前不扩全片。本地提交 `feat: stage last bread motion pilot`。

### Task 3: 把短段扩成8镜头，接触与相机共用时间轴
**Files:** motion.js、sets.js、shots.js、timeline.test.mjs。
**Interfaces:** 沿用 Bread.sample/drawFrame；`Bread.shotStarts=[0,7,13,23,30,36,45,53]`；`shots` 注册每个开始时间。sets 只公开 `Bread.drawSet(state)` 与 `Bread.drawProps(state,layer)`，layer=back/front；camera 使用原 camBegin/camEnd 配对。
- [ ] 写 timeline 测试：60秒内恰8镜头；边界±1/24秒不漏状态；跨镜头面包 wrapped 与持有者状态连贯；围裙准备完成时鸟喙与布角距离≤3px；落布期间面包底不穿布面；每个镜头存在角色注视目标与动作变化。
- [ ] 运行该测试见失败；按 spec 时间表加入店前、坡路、斜板三套可复用布景；布局保证跑动方向一致，运镜跟随角色但不遮掉碰撞/接布原因。围裙双端来自手/喙锚点，承重下沉由同一事件驱动。
- [ ] 跑 `node --test tests/last-bread/*.test.mjs` PASS；在安全 runner 渲染每镜头开始/动作峰值/结束联系表及接触邻帧，实际看叙事与背景遮挡；保留5秒已通过动作节奏。本地提交 `feat: stage all eight last bread shots`。

### Task 4: 音乐与拟音跟同一事件走
**Files:** film/last-bread/events.json、score.json、scripts/build-last-bread-audio.sh、verify-last-bread.py；motion.test.mjs 增补事件断言。
**Interfaces:** events 沿用现有 `{t,sfx,gain_db,pan?,dur?,why}`；why 引用 Bread.events 的 id，时间从该表生成/核对，不手抄两套常量。脚本输出 `film/last-bread/{mix.wav,mix-aac.m4a,stems,technical-qa.json}`；`verify-last-bread.py FILE --duration 5|60 --frames 120|1440` 检查音视频或以 `--audio-only` 验音频。
- [ ] 加失败测试：事件 id 唯一、时间在[0,60)、关键碰撞/扑空急停/啾脚跟上/布接住/帽回扣都有 cue；声音事件与动作表差≤1/24秒；结尾cue的尾音在60秒内平滑结束。
- [ ] 用已有 sfx/music/mix CLI 制作新 score 和事件，轻巧音乐不覆盖关键呼吸感；不复用叶子片成品音轨。导出48kHz双声道 AAC，混音目标约−14 LUFS、编码后 true peak≤−1.5dBTP；pilot截取16–21秒并作短淡入淡出。
- [ ] `bash scripts/build-last-bread-audio.sh`，再 `python scripts/verify-last-bread.py film/last-bread/mix-aac.m4a --duration 60 --audio-only` 应 PASS；实际听开头/中段/尾声与所有关键cue，修刺耳、遮蔽和错位。本地提交 `feat: score last bread action beats`。

### Task 5: 完整渲染与最终审片
**Files:** last-bread.yml、render-last-bread.mjs、verify-last-bread.py、runner.test.mjs、docs/last-bread-review.md。
**Interfaces:** 分段清单 `{first,end,frames,fps,duration,width,height,sourceSha,timing}`；范围连续无重叠计数，额外边界帧单独保存。full仅在短段获准且测时通过后手动触发；同ref+stage concurrency避免重复计算。
- [ ] 写/跑失败测试：1440帧任意合法分段完整覆盖[0,1440)，无漏/重复；重试只替换该段产物；全部清单 SHA/尺寸/采样率不一致则拒绝拼接；phase=pilot不得跑1440帧。
- [ ] 按任务2实测选 chunks 与并发（不预承诺6段能完成60秒），使用标准 runner；每段预检并编码，记录同时间边界重渲 SSIM 诊断与关键帧，不把该分数当视觉门槛。缓存仅在前后同时间图像与动作稳定性对照通过后启用。
- [ ] 测试 PASS，授权后运行全片；监控到成功/失败/实际阻碍，修可恢复问题、只重跑必要段。合并后执行 `python scripts/verify-last-bread.py out/last-bread.mp4 --duration 60 --frames 1440`，验证编码、全解码、时长、音频峰值、BT.709；保存SHA256和8镜头联系表。
- [ ] 完整连续观看/听审60秒，并逐帧看事故、急停、卡住再滚、喙牵布、面包接住、帽回扣；检查表情/接触/节奏，不以testpass冒充审片。新入口与原入口均作安全runner抽帧回归；原受保护文件与基线git diff应空。
- [ ] 写真实结果、未解决问题、来源与版本到 review 文档，本地提交 `test: verify last bread full film`。只在另外获准的交付渠道提供视频；保留原案例和源历史。

## 审阅请求与自检
已将角色、分轨、场景/相机、共享事件音轨、短段/全片视觉QA、性能/安全限制对应到任务1–5；没有产品实现、push、Actions或上传。计划审阅确认后沿用既定 p5/p5.brush + GitHub Actions 方法，不再询问换引擎或执行流。
