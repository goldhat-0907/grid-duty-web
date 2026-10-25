/* js/hints.js — 三级提示系统：知识/技能/操作，分层 + 时间代价（随辅助档与难度档） */
window.GDW = window.GDW || {};
window.GDW.hints = (function () {
  "use strict";
  var ENR = window.GDW.enrichment;
  var LABEL2KEY = { "引导": "guided", "平衡": "balanced", "挑战": "challenge" };

  function assistKey(label) { return LABEL2KEY[label] || "balanced"; }

  /* 提示扣时：基础代价 × 难度档 hintMult（专家×2；新员×0） */
  function cost(s, tier) {
    var key = assistKey(s.assist);
    var base = ENR.presets.assist[key].hintCost[tier] || 0;
    return base * (s.hintMult || 1);
  }

  function meterLabel(m) { var meta = ENR.meters[m]; return meta ? meta.label : m; }

  function devFor(s, meter) {
    var enr = ENR.levels[s.id];
    var found = null;
    Object.keys(enr.meta.actions || {}).forEach(function (aid) {
      var a = enr.meta.actions[aid];
      var act = s.actions.find(function (x) { return x.id === aid; });
      if (act && act.effect[meter] !== undefined && !found) found = a.dev;
    });
    return found || enr.meta.dev;
  }

  /* 取一档提示内容；操作提示按辅助档 opDetail：引导→完整序列，平衡→序列文字，挑战→仅设备高亮 */
  function view(s, tier) {
    var enr = ENR.levels[s.id];
    var h = enr.hints;
    var text = "", deviceId = null, costSec = cost(s, tier);
    if (tier === "know") {
      text = h.know[0];
    } else if (tier === "skill") {
      text = h.skill[0];
    } else {
      var key = assistKey(s.assist);
      var detail = ENR.presets.assist[key].opDetail;
      deviceId = enr.meta.dev;
      if (detail === "full" || detail === "text") text = h.op[1] || h.op[0];
    }
    return { text: text, deviceId: deviceId, cost: costSec };
  }

  /* 状态感知教练 guide()：按当前表计状态返回 {text, deviceId}，UI 高亮对应设备 */
  function guide(s) {
    var enr = ENR.levels[s.id];
    var m = s.meters, dev = enr.meta.dev;
    var rules = (enr.checks && enr.checks.fail) || [];
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.t === "below" && m[r.meter] < r.v) return { text: meterLabel(r.meter) + "偏低，优先处理它", deviceId: devFor(s, r.meter) };
      if (r.t === "above" && m[r.meter] > r.v) return { text: meterLabel(r.meter) + "越上限，需要降下来", deviceId: devFor(s, r.meter) };
      if (r.t === "out_of_band") {
        if (m[r.meter] < r.lo) return { text: meterLabel(r.meter) + "偏低，把它拉回带内", deviceId: devFor(s, r.meter) };
        if (m[r.meter] > r.hi) return { text: meterLabel(r.meter) + "偏高，把它降回带内", deviceId: devFor(s, r.meter) };
      }
    }
    var tr = (enr.checks && enr.checks.target) || [];
    for (var j = 0; j < tr.length; j++) {
      var t = tr[j];
      if (t.t === "hold" || t.t === "hold_dev") {
        var v = t.t === "hold_dev" ? (m[t.meter] - m[t.ref]) : m[t.meter];
        if (v < t.lo || v > t.hi) return { text: "让 " + meterLabel(t.meter) + " 回到带内并保持", deviceId: devFor(s, t.meter) };
      }
    }
    return { text: "当前状态稳定，按目标继续推进即可", deviceId: dev };
  }

  return { cost: cost, view: view, guide: guide, meterLabel: meterLabel };
})();
