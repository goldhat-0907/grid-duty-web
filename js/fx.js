/* js/fx.js — 反馈总线：Web Audio 合成音效 + 震动 + 动画触发器 */
window.GDW = window.GDW || {};
window.GDW.fx = (function () {
  "use strict";
  var ctx = null, noiseSrc = null, noiseGain = null;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") { try { ctx.resume(); } catch (e) { } }
  }

  function tone(freq, dur, type, gain) {
    if (!ctx) return;
    try {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine"; o.frequency.value = freq;
      g.gain.value = gain || 0.06;
      o.connect(g); g.connect(ctx.destination);
      var t = ctx.currentTime;
      g.gain.setValueAtTime(gain || 0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch (e) { }
  }

  function click() { ensure(); tone(880, 0.22, "sine", 0.06); }
  function deny() { ensure(); tone(170, 0.16, "square", 0.05); }
  function alarm(sev) {
    ensure();
    if (sev === "critical") {
      tone(880, 0.5, "square", 0.08);
      setTimeout(function () { tone(880, 0.5, "square", 0.08); }, 550);
    } else {
      tone(660, 0.12, "square", 0.06);
      setTimeout(function () { tone(660, 0.12, "square", 0.06); }, 160);
    }
  }
  function success() {
    ensure();
    tone(523, 0.18, "sine", 0.07);
    setTimeout(function () { tone(784, 0.24, "sine", 0.07); }, 180);
  }
  function ack() { ensure(); tone(1250, 0.1, "triangle", 0.05); }

  function vibrate(ms) {
    if (navigator && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { } }
  }

  function startAmbient() {
    ensure();
    if (!ctx || noiseGain) return;
    try {
      var len = ctx.sampleRate * 2;
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = buf; noiseSrc.loop = true;
      var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 300;
      noiseGain = ctx.createGain(); noiseGain.gain.value = 0.012;
      noiseSrc.connect(f); f.connect(noiseGain); noiseGain.connect(ctx.destination);
      noiseSrc.start();
    } catch (e) { }
  }

  function stopAmbient() {
    if (noiseGain) { try { noiseGain.gain.value = 0; } catch (e) { } }
    noiseGain = null; noiseSrc = null;
  }

  return { click: click, deny: deny, alarm: alarm, success: success, ack: ack, vibrate: vibrate, startAmbient: startAmbient, stopAmbient: stopAmbient };
})();
