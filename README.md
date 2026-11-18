# DT2140 Lab 2 – Sound and Gestures in Interaction

Our group's work for DT2140 Lab 2. We use the phone's motion sensors to detect gestures and control sounds synthesized with **Faust** (compiled to WebAssembly, running in the browser).

Forked from the course template: [smc-kth/DT2140-Sound-Interaction-Lab](https://github.com/smc-kth/DT2140-Sound-Interaction-Lab). The original setup instructions are there.

## Live pages (open on your phone)

| # | Page | Link |
|---|------|------|
| 1 | Interaction 1 | https://rasney.github.io/DT2140-Sound-Interaction-Lab/ |
| 2 | Interaction 2 | https://rasney.github.io/DT2140-Sound-Interaction-Lab/sound2.html |
| 3 | Interaction 3 | https://rasney.github.io/DT2140-Sound-Interaction-Lab/sound3.html |

You can also switch pages with the **Interaction 1 / 2 / 3** buttons at the top of each page.

## Our mappings

| # | Action (Table 1) | Sound (Table 2) | Status |
|---|------------------|-----------------|--------|
| 1 | The phone free falls for more than 30 cm | Thunder | Done and tested on phone |
| 2 | The phone is used to measure the angle of a surface, like a level | Bells | Works on phone; page description still missing |
| 3 | The phone is placed flat in the hand and tilted from side to side | Creaking door | Latest fix pushed, **needs phone test**; page description still missing |

### 1. Free fall → Thunder (`interaction-1.js`, `tuono.wasm`)

- **Use case:** a drop alarm. If the phone slips off a table or out of a pocket, it plays thunder so the owner notices.
- **Why thunder:** a fall is sudden, uncontrolled and bad news. Thunder is sudden, loud and low-pitched, and people associate it with danger. Bells or music would send the wrong message, as if dropping the phone were something good.
- **How it works:** at rest the accelerometer measures gravity (about **20** in this template, because p5.js scales acceleration ×2). In free fall the total acceleration drops to almost 0. If the magnitude `sqrt(x² + y² + z²)` stays **below 3 for more than 0.2 s**, the thunder plays. Falling 30 cm takes about 0.25 s (t = √(2h/g)), and the time condition stops quick hand movements from triggering it. It plays only once per fall.
- **Test:** drop the phone from 30–50 cm onto a bed or sofa. Shaking it should **not** trigger the thunder.

### 2. Level → Bells (`interaction-2.js`, `bells.wasm`)

- **Use case:** using the phone as a spirit level, for example when mounting a shelf. While adjusting, you look at the shelf, not the screen.
- **Why bells:** a bell is short, clear and positive, a common "done / correct" signal (microwave, service bell). It is the opposite of mapping 1: thunder means something went wrong, the bell means something went right.
- **How it works:** uses orientation angles. Rotation X is front-back tilt and Rotation Y is left-right tilt. When both are within **±1.5°**, the bell rings once. It can ring again only after the phone is tilted by **more than 3°**. The two thresholds are deliberate (*hysteresis*): without them, small hand tremors around 1.5° would make the bell ring again and again.
- **Test:** lay the phone flat (Rotation X/Y should be close to 0), tilt it, then put it back flat. It should ring once.

### 3. Tilt side to side → Creaking door (`interaction-3.js`, `door.wasm`)

- **Use case / metaphor:** the palm is the door and the wrist is the hinge. Tilting the hand is like pushing a door.
- **Why a creaking door:** a real door creaks only while it moves, and creaks more when pushed harder. So the sound follows the movement directly.
- **How it works:** the **speed** of the left-right tilt (change of Rotation Y per frame) sets the "force" on the door. Moving starts the creak quickly; when the hand stops, the force fades out over about half a second and the door goes silent. Changes larger than 30° in one frame are ignored, because the gyroscope angle jumps near ±90° (the jump mentioned in the lab instructions).
- **Things we learned about this sound:** the door model is almost on/off. Below `position ≈ 0.02` it is silent; above it, it creaks at about the same loudness, and only the rhythm changes. If the position is held constant it sounds like a continuous buzz. The model is also much quieter than the thunder, so we boost it ×3 with a Web Audio gain node.
- **Debug line:** the green text at the bottom of the page shows `audio`, `rotY`, `speed` and `force` live, so you can see what the code is doing on the phone. Remove it before the demo if we don't want it.
- **Desktop test:** after **Turn On DSP**, click anywhere on the page to make the door creak briefly. The further right you click, the wider the door opens.

## How to test on the phone

1. **iPhone: turn off the silent switch** on the side of the phone. Otherwise Web Audio is muted even at full volume.
2. Open the page and tap **Turn On DSP**. The button should change to **Turn Off DSP**.
3. Allow **Motion & Orientation** access when asked. If the Acceleration/Rotation numbers on screen don't change when you move the phone, the permission is missing.
4. Use Safari on iPhone and Chrome on Android.

## How to edit and publish

1. Clone the repo and open the folder `DT2140-Sound-Interaction-Lab` in VS Code (`File → Open Folder`). Run git commands **inside this folder**.
2. Edit the files (see the next section). Turn on **File → Auto Save**. Several times we pushed before the file was saved.
3. Push:
   ```bash
   git add .
   git commit -m "describe your change"
   git push
   ```
4. GitHub Pages redeploys automatically. Check the repo's **Actions** tab and wait for a green tick (1–3 minutes).
5. Test on the phone. **Watch out for the cache:** adding `?v=2` to the URL only refreshes the HTML page. The `.js` and `.wasm` files can stay cached for about 10 minutes. The safest way is to open the page in a **private/incognito tab**.

The motion sensors only work over **HTTPS**, so the phone has to use the GitHub Pages link. VS Code **Live Server** (right-click `sound3.html` → *Open with Live Server*) is still useful on the laptop to check that the sound loads: press **F12 → Console** and look for a line like `params: [...]`.

## What is in the repo

| File | What it does | Do we edit it? |
|------|--------------|----------------|
| `index.html`, `sound2.html`, `sound3.html` | The three pages. The `<div id="info">` text is the design description for each mapping | Yes, the description text |
| `interaction-1.js`, `-2.js`, `-3.js` | Our gesture detection and sound control for each page | **Yes, this is where our code is** |
| `tuono.wasm`, `bells.wasm`, `door.wasm` | Compiled Faust sounds (thunder, bells, door) | Only when adding a new sound |
| `faust-dsp/` | Faust source code of all the available sounds | No |
| `sketch.js`, `helpers.js`, `dsp.js`, `styles.css` | Course template: sensor reading, UI, WASM loader | No |

In each `interaction-n.js`, the parts we changed are:

- `accelerationChange(accx, accy, accz)` and `rotationChange(rotx, roty, rotz)`: called every frame with the sensor values. This is where gestures are detected.
- `playAudio()`: sets the sound parameters with `dspNode.setParamValue("/address", value)`.
- `deviceShaken()`: we removed the template's `playAudio()` call here, otherwise shaking the phone would also trigger our sounds.

## How to add or change a sound

1. Open the `.dsp` file from `faust-dsp/` in the [Faust IDE](https://faustide.grame.fr). **Name the file after the sound** (e.g. `door.dsp`), because the WASM name and parameter addresses come from it.
2. Export it as WASM and put `name.wasm` in the repo root, next to `tuono.wasm`. (The Faust IDE export uses a remote server and sometimes hangs. Compiling with the Faust compiler locally gives the same file.)
3. In `interaction-n.js`, change the name in **both** places:
   ```js
   const dspName = "door";                                   // line ~15
   const instance = new FaustWasm2ScriptProcessor(dspName);  // keep this line!
   ...
   door.createDSP(audioContext, 1024)                        // line ~28
   ```
   Keep the `const instance = ...` line. It creates the global variable (`door`). Deleting it gives the error `door is not defined`.
4. Open the page and check the console line `params: [...]` for the parameter addresses, e.g. `/door/door/position` and `/door/volume`. Always check each parameter's min/max before sending values, so the speakers don't get too loud.

## Sensor notes

- Acceleration values are scaled ×2 by p5.js: about 20 at rest instead of 9.8.
- Rotation values are in **degrees**. Rotation X ranges −180° to 180°, Rotation Y (left-right) about −90° to 90°. Angles **jump** when you pass these limits, so ignore unrealistically large changes between frames.
- Every phone is a bit different. Look at the numbers on screen before choosing thresholds.

## To do

- [ ] Test mapping 3 on the phone with the latest version (green debug line at the bottom)
- [ ] Write the design description in `sound2.html` (mapping 2) and `sound3.html` (mapping 3), replacing the Lorem ipsum
- [ ] Decide whether to keep the debug line on page 3 for the demo
- [ ] Optional: a 4th mapping
- [ ] Canvas submission (*Assignment Lab 2: Sound and Gestures in Interaction*): partner's full name, link to this repo, the mapping table above
- [ ] Rehearse: one of us presents one mapping at the end of the lab. Explain **use case → why this sound → how it is detected**

## Credits

Template by Maurizio Berta and Laura McHugh for DT2140, KTH. Sound models from the Faust libraries; most are based on Andy Farnell's *Designing Sound*.
