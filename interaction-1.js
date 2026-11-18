//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

// The name should match the WASM file.
const dspName = "drop";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

drop.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/drop/drop");
        // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
        // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
        // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    });


//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
//
//==========================================================================================

// 注意：p5.js 的 accelerationX/Y/Z 来自 e.acceleration，按 Web 标准是"去掉重力"的加速度，
// 静止时约为 0，不能用来判断自由落体。这里自己读取"含重力"的加速度：
// 静止时合加速度约 9.8 m/s²，自由落体时接近 0，而且和手机朝向无关。
let gMag = 9.8;              // 含重力的三轴合加速度 (m/s²)
window.addEventListener("devicemotion", (e) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x === null) return;
    gMag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
});

const FALL_THRESHOLD = 3;    // m/s²：远低于静止时的 9.8，才算失重
const FALL_TIME = 250;       // ms：自由下落 30 cm 约需 0.25 s（h = ½gt²）
const RESET_THRESHOLD = 7;   // m/s²：重新感受到重力（被接住/落地）后才允许下一次

let fallStart = null;
let fallTriggered = false;
let dbg = null;

function showDebug(txt) {
    // 页面底部的调试信息，方便在手机上看数值
    if (!dbg) {
        dbg = document.createElement("div");
        dbg.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:999;" +
            "background:#000;color:#0f0;font:14px monospace;padding:6px;";
        document.body.appendChild(dbg);
    }
    dbg.textContent = txt;
}

function accelerationChange(accx, accy, accz) {
    if (gMag < FALL_THRESHOLD) {                 // 失重：开始或继续计时
        if (fallStart === null) fallStart = millis();
        if (!fallTriggered && millis() - fallStart > FALL_TIME) {
            playAudio();                         // 自由下落超过约 30 cm → 水滴声
            fallTriggered = true;                // 一次下落只响一次
        }
    } else {
        fallStart = null;                        // 不再失重，计时清零
        if (gMag > RESET_THRESHOLD) fallTriggered = false;
    }

    showDebug("|a| incl. gravity: " + gMag.toFixed(1) + " m/s²" +
        (fallStart !== null ? "  FALLING " + (millis() - fallStart) + " ms" : ""));
}

function rotationChange(rotx, roty, rotz) {
}

function mousePressed() {
    playAudio()
    // Use this for debugging from the desktop!
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function playAudio() {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    dspNode.setParamValue("/drop/drop", 1);
    setTimeout(() => { dspNode.setParamValue("/drop/drop", 0); }, 100);
}

//==========================================================================================
// END
//==========================================================================================