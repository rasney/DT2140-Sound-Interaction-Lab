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

// Change here to ("tuono") depending on your wasm file name
const dspName = "door";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
door.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        const boost = audioContext.createGain();   // 开门声模型本身很轻，放大 3 倍
        boost.gain.value = 3;
        dspNode.connect(boost);
        boost.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
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

function accelerationChange(accx, accy, accz) {
    // playAudio()
}

let lastRoty = null;
let force = 0;        // 推门的力度 0–1
let debugUntil = 0;   // 电脑调试时暂停传感器控制
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

function rotationChange(rotx, roty, rotz) {
    if (!dspNode) { showDebug("door.wasm loading..."); return; }
    if (millis() < debugUntil) return;
    if (lastRoty === null) { lastRoty = roty; return; }

    // 左右倾斜的速度（每帧转了多少度）
    let speed = Math.abs(roty - lastRoty);
    lastRoty = roty;
    if (speed > 30) speed = 0;               // 接近 ±90° 时的数值跳变，不算转动

    // 一转动就推门（快速起声），停下后约半秒内慢慢松开
    const target = Math.min(speed / 2, 1);
    force = Math.max(target, force * 0.9);
    const position = force < 0.05 ? 0 : force * 0.5;   // 低于门槛直接静音

    dspNode.setParamValue("/door/door/position", position);
    dspNode.setParamValue("/door/volume", 1.0);

    showDebug("audio:" + audioContext.state +
        " rotY:" + roty.toFixed(1) +
        " speed:" + speed.toFixed(1) +
        " force:" + force.toFixed(2));
}

function mousePressed() {
    playAudio(mouseX/windowWidth)
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

function playAudio(pos) {
    // 仅用于电脑调试：点击页面时，按鼠标横向位置让门吱呀一下
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    debugUntil = millis() + 800;
    dspNode.setParamValue("/door/door/position", pos * 0.5);
    dspNode.setParamValue("/door/volume", 1.0);
}

//==========================================================================================
// END
//==========================================================================================