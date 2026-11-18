# DT2140 Lab 2：交互中的声音与手势

[English](README.md) | 中文

这是我们小组 DT2140 Lab 2 的作业。我们用手机的运动传感器识别手势，再用这些手势控制 **Faust** 合成的声音。声音被编译成 WebAssembly，直接在浏览器里运行。

本仓库 fork 自课程模板 [smc-kth/DT2140-Sound-Interaction-Lab](https://github.com/smc-kth/DT2140-Sound-Interaction-Lab)，原始的环境搭建说明在那里。

## 在线页面（用手机打开）

| # | 页面 | 链接 |
|---|------|------|
| 1 | Interaction 1 | https://rasney.github.io/DT2140-Sound-Interaction-Lab/ |
| 2 | Interaction 2 | https://rasney.github.io/DT2140-Sound-Interaction-Lab/sound2.html |
| 3 | Interaction 3 | https://rasney.github.io/DT2140-Sound-Interaction-Lab/sound3.html |

也可以点每个页面顶部的 **Interaction 1 / 2 / 3** 按钮切换。

## 我们的映射

| # | 动作（表 1） | 声音（表 2） | 进度 |
|---|------------------|-----------------|--------|
| 1 | 手机自由落体超过 30 cm | 雷声 | 已完成，手机测试通过 |
| 2 | 像水平仪一样测量表面角度 | 铃声 | 手机上能用；页面说明还没写 |
| 3 | 手机平放在手上左右倾斜 | 吱呀的开门声 | 最新修复已 push，**需要手机测试**；页面说明还没写 |

### 1. 自由落体 → 雷声（`interaction-1.js`、`tuono.wasm`）

- **使用场景：** 防摔提醒。手机从桌上滑落或从口袋里掉出来时播放雷声，让主人注意到。
- **为什么选雷声：** 掉落是突然的、不受控的，而且是坏事。雷声同样突然、响亮、低沉，人们会把它和危险联系起来。如果用铃声或乐器声，就会传达错误的信息，好像掉手机是件好事。
- **实现方式：** 手机静止时，加速度计测到的是重力。在这个模板里静止读数约为 **20**，因为 p5.js 把加速度放大了 2 倍。自由下落时总加速度会降到接近 0。如果合加速度 `sqrt(x² + y² + z²)` **低于 3 并持续超过 0.2 秒**，就播放雷声。下落 30 cm 大约需要 0.25 秒（t = √(2h/g)），这个时间条件可以防止手快速晃动造成误触发。每次下落只响一次。
- **测试方法：** 在床或沙发上方 30–50 cm 处松手。摇晃手机**不应该**触发雷声。

### 2. 水平仪 → 铃声（`interaction-2.js`、`bells.wasm`）

- **使用场景：** 把手机当水平仪用，比如安装架子时。调整的时候人看着的是架子，而不是手机屏幕。
- **为什么选铃声：** 铃声短促、清脆、积极，是常见的"完成/正确"提示，比如微波炉或柜台上的服务铃。它和映射 1 正好相反：雷声表示出了问题，铃声表示做对了。
- **实现方式：** 使用姿态角度。Rotation X 是前后倾斜，Rotation Y 是左右倾斜。两者都在 **±1.5°** 以内时，铃声响一次。只有手机先倾斜**超过 3°**，铃声才能再次响起。两个阈值不同是故意的，这叫做**迟滞（hysteresis）**：没有它，手在 1.5° 附近轻微抖动，铃声就会反复响个不停。
- **测试方法：** 把手机平放（Rotation X/Y 应该接近 0），拿起来倾斜，再放回平面，应该响一次。

### 3. 左右倾斜 → 吱呀的开门声（`interaction-3.js`、`door.wasm`）

- **使用场景/隐喻：** 手掌是门板，手腕是门的铰链。倾斜手掌就像在推门。
- **为什么选开门声：** 真实的门只有在转动时才会吱呀作响，推得越用力，响得越厉害。所以声音直接跟随动作。
- **实现方式：** 用左右倾斜的**速度**（每帧 Rotation Y 的变化量）决定推门的"力度"。一开始动，吱呀声马上出现；手停下后，力度在大约半秒内逐渐减弱，门就安静了。单帧变化超过 30° 的数值会被忽略，因为陀螺仪角度在 ±90° 附近会跳变（实验说明里提到的就是这个问题）。
- **关于这个声音的经验：** 开门声模型几乎是"开/关"式的。`position` 低于约 0.02 时完全没声音；高于它以后响度基本不变，变的只是吱呀的节奏。如果 position 保持不变，听起来就像持续的蜂鸣。这个模型也比雷声轻很多，所以我们用一个 Web Audio 增益节点把它放大了 3 倍。
- **调试信息：** 页面底部的绿色文字实时显示 `audio`、`rotY`、`speed` 和 `force`，在手机上就能看到代码在做什么。如果演示时不想显示，可以删掉。
- **电脑上测试：** 点 **Turn On DSP** 后，点击页面任意位置，门会短暂地吱呀一下。点得越靠右，吱呀的节奏越快。

## 手机测试注意事项

1. **iPhone：关掉侧面的静音拨片。** 否则即使音量调到最大，网页里的声音也会被静音。
2. 打开页面，点 **Turn On DSP**，按钮会变成 **Turn Off DSP**。
3. 弹出 **运动与方向** 权限时选择允许。如果移动手机时屏幕上的 Acceleration/Rotation 数值不变，说明没有拿到权限。
4. iPhone 用 Safari，Android 用 Chrome。

## 修改和发布流程

1. clone 仓库后，在 VS Code 里打开 `DT2140-Sound-Interaction-Lab` 文件夹（`File → Open Folder`）。git 命令要**在这个文件夹里**运行。
2. 修改文件（见下一节）。建议打开 **File → Auto Save**：我们好几次在文件还没保存时就 push 了。
3. 推送：
   ```bash
   git add .
   git commit -m "描述你的修改"
   git push
   ```
4. GitHub Pages 会自动重新部署。到仓库的 **Actions** 标签页等出现绿勾（1–3 分钟）。
5. 用手机测试。**注意缓存：** 在网址后加 `?v=2` 只能刷新 HTML 页面本身，`.js` 和 `.wasm` 文件可能还会被缓存约 10 分钟。最稳妥的方法是用**无痕/隐私模式**打开页面。

运动传感器只能在 **HTTPS** 下使用，所以手机测试必须用 GitHub Pages 的链接。在电脑上，VS Code 的 **Live Server**（右键 `sound3.html` → *Open with Live Server*）仍然适合检查声音能否加载：按 **F12 → Console**，看有没有类似 `params: [...]` 的一行。

## 仓库里的文件

| 文件 | 作用 | 我们改不改 |
|------|--------------|----------------|
| `index.html`、`sound2.html`、`sound3.html` | 三个页面。`<div id="info">` 里的文字是每个映射的设计说明 | 改说明文字 |
| `interaction-1.js`、`-2.js`、`-3.js` | 每个页面的手势检测和声音控制 | **改，我们的代码都在这里** |
| `tuono.wasm`、`bells.wasm`、`door.wasm` | 编译好的 Faust 声音（雷声、铃声、开门声） | 只有加新声音时才动 |
| `faust-dsp/` | 所有可用声音的 Faust 源代码 | 不改 |
| `sketch.js`、`helpers.js`、`dsp.js`、`styles.css` | 课程模板：读取传感器、界面、加载 WASM | 不改 |

在每个 `interaction-n.js` 里，我们改动的部分是：

- `accelerationChange(accx, accy, accz)` 和 `rotationChange(rotx, roty, rotz)`：每一帧都会带着传感器数值被调用，手势检测写在这里。
- `playAudio()`：用 `dspNode.setParamValue("/地址", 数值)` 设置声音参数。
- `deviceShaken()`：我们删掉了模板在这里调用的 `playAudio()`，否则摇晃手机也会触发声音。

## 如何添加或更换声音

1. 在 [Faust IDE](https://faustide.grame.fr) 里打开 `faust-dsp/` 中的 `.dsp` 文件。**文件要以声音命名**（比如 `door.dsp`），因为导出的 WASM 文件名和参数地址都来自这个名字。
2. 导出为 WASM，把 `名字.wasm` 放到仓库根目录，和 `tuono.wasm` 放在一起。（Faust IDE 的导出依赖远程服务器，有时会一直转圈。用 Faust 编译器在本地编译，得到的文件是一样的。）
3. 在 `interaction-n.js` 里，**两处**名字都要改：
   ```js
   const dspName = "door";                                   // 约第 15 行
   const instance = new FaustWasm2ScriptProcessor(dspName);  // 这一行要保留！
   ...
   door.createDSP(audioContext, 1024)                        // 约第 28 行
   ```
   一定要保留 `const instance = ...` 这一行，它负责创建全局变量（比如 `door`）。删掉它就会报错 `door is not defined`。
4. 打开页面，在控制台的 `params: [...]` 那一行里找参数地址，比如 `/door/door/position` 和 `/door/volume`。发送数值前要先确认每个参数的最小值和最大值，避免扬声器声音过大。

## 传感器注意事项

- 加速度被 p5.js 放大了 2 倍：静止时约为 20，而不是 9.8。
- 旋转角度的单位是**度**。Rotation X 范围是 −180° 到 180°，Rotation Y（左右）大约是 −90° 到 90°。越过这些边界时角度会**跳变**，所以要忽略帧与帧之间不合理的大变化。
- 每部手机都有差异，确定阈值之前先看一下屏幕上的数值。

## 待办事项

- [ ] 用最新版本在手机上测试映射 3（看页面底部的绿色调试信息）
- [ ] 在 `sound2.html`（映射 2）和 `sound3.html`（映射 3）里写设计说明，替换掉 Lorem ipsum
- [ ] 决定演示时是否保留第 3 页的调试信息
- [ ] 可选：第 4 个映射
- [ ] Canvas 提交（*Assignment Lab 2: Sound and Gestures in Interaction*）：搭档全名、本仓库链接、上面的映射表
- [ ] 排练：实验结束时我们之中一人要展示一个映射。按 **使用场景 → 为什么选这个声音 → 如何检测** 的顺序讲

## 致谢

模板由 Maurizio Berta 和 Laura McHugh 为 KTH DT2140 课程开发。声音模型来自 Faust 库，大部分基于 Andy Farnell 的 *Designing Sound*。
