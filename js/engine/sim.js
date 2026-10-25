/* js/engine/sim.js — 模拟演化：表计漂移 / 时段切换 / 事件序列（calc_sync 关卡） */
window.GDW = window.GDW || {};
window.GDW.sim = (function () {
  "use strict";
  var ENR = window.GDW.enrichment;
  var clamp = ENR.clamp;
  var LABEL2KEY = { "新员": "rookie", "标准": "standard", "专家": "expert" };

  function driftMult(s) {
    var key = LABEL2KEY[s.difficulty] || "standard";
    var p = ENR.presets.difficulty[key];
    return p ? p.drift : 1;
  }

  /* 每 tick 推进：返回触发的事件文案数组 */
  function step(s, dt) {
    var evs = [];
    var enr = ENR.levels[s.id];
    if (!enr || !enr.sim) return evs;
    var dm = driftMult(s);

    if (enr.sim.drift) enr.sim.drift(s, dt * dm);
    if (enr.sim.windDrift) {
      s.meters.wind_mw = clamp(s.meters.wind_mw + 0.8 * dm * Math.sin(s.timeUsed / 2.0) * dt, 110, 175);
    }
    if (enr.sim.islandDrift) {
      s.meters.freq = clamp(s.meters.freq - 0.001 * dt * dm, 48.9, 50.4);
    }
    if (enr.sim.period) {
      if (s.timeUsed < 40) s.meters.period = 0.3;
      else if (s.timeUsed < 110) s.meters.period = 1.2;
      else s.meters.period = 0.6;
    }
    if (enr.sim.mainBackAt && s.timeUsed >= enr.sim.mainBackAt && !s.flags.main_back) {
      s.flags.main_back = 1;
      evs.push("主网来电，可以进行同期并网！");
    }
    if (enr.sim.events) {
      enr.sim.events.forEach(function (ev) {
        if (s.timeUsed >= ev.at && !s.fired[ev.at]) {
          s.fired[ev.at] = 1;
          ev.fn(s);
          evs.push(ev.text);
        }
      });
    }
    return evs;
  }

  return { step: step, driftMult: driftMult };
})();
