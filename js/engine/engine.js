/* js/engine/engine.js — 通用表计引擎：meters + actions/effects + target/fail + cost/limit + 角色/技能/档位 */
window.GDW = window.GDW || {};
window.GDW.engine = (function () {
  "use strict";
  var DATA = window.GDW.data, ENR = window.GDW.enrichment;
  var clamp = ENR.clamp;

  function findLevel(id) { return DATA.PACK.levels.find(function (l) { return l.id === id; }); }

  /* 装载一局：应用难度档乘数，构造 state */
  function build(levelId, opts) {
    opts = opts || {};
    var level = findLevel(levelId);
    var enr = ENR.levels[levelId];
    var difficulty = ENR.presets.difficulty[opts.difficulty] || ENR.presets.difficulty.standard;
    var assist = ENR.presets.assist[opts.assist] || ENR.presets.assist.balanced;
    var role = opts.role || level.role_hint;
    var ownedSkills = opts.skills || [];

    var meters = {};
    Object.keys(level.meters).forEach(function (k) { meters[k] = level.meters[k]; });

    var s = {
      id: level.id, name: level.name, section: level.section, brief: level.brief,
      targetText: level.target, role: role,
      duration: Math.round(level.duration * difficulty.duration),
      timeUsed: 0, timeLeft: Math.round(level.duration * difficulty.duration),
      difficulty: difficulty.label, assist: assist.label,
      difficultyMult: difficulty.credit,
      redlineSlack: difficulty.redlineSlack,
      hintMult: difficulty.hintMult,
      opDetail: assist.opDetail, autoAnnotate: assist.autoAnnotate,
      roleData: DATA.PACK.roles[role],
      ownedSkills: ownedSkills.slice(),
      meters: meters,
      log: [],
      fired: {},
      flags: {},
      counters: { out: {}, hold: {}, sec: {} },
      handover: null,
      pending: null, busy: null,
      achieved: false, failed: false, over: false,
      metrics: { bandBreaks: 0, mistakes: 0, greenCalls: 0, hintCost: 0, timeUsed: 0 },
      rewardSkill: (level.rewards.skills && level.rewards.skills[0]) || null
    };

    s.actions = level.actions.map(function (a) {
      var meta = (enr.meta && enr.meta.actions && enr.meta.actions[a.id]) || {};
      var remaining = Infinity;
      if (a.limit_by) remaining = Math.max(1, meters[a.limit_by] || 0);
      return {
        id: a.id, name: a.name, cost: a.cost, effect: a.effect || {},
        need_skill: a.need_skill || null, limit_by: a.limit_by || null, remaining: remaining,
        op: meta.op || "field", dev: meta.dev || null
      };
    });

    if (enr.meta && enr.meta.gate) s.gate = enr.meta.gate;
    if (levelId === 1) {
      s.handover = { checked: 0, missed: 0, misjudge: 0, items: [] };
      level.checks.forEach(function (key) {
        var abnormal = key === "alarms"; // 交接班六项：告警未消为异常项
        s.handover.items.push({ key: key, abnormal: abnormal, done: null });
      });
    }
    return s;
  }

  function costOf(s, action) {
    var cf = 1;
    if (s.roleData.bonus && s.roleData.bonus.action_speed) cf *= s.roleData.bonus.action_speed;
    if (s.ownedSkills.indexOf("switching") >= 0 && action.op === "breaker") cf *= 0.5;
    return Math.max(1, Math.round(action.cost * cf));
  }

  function selectedHandoverItem(s, key) {
    if (!s.handover) return null;
    return s.handover.items.find(function (it) { return it.key === key; }) || null;
  }

  /* 门禁检查 */
  function canAct(s, actionId, extra) {
    if (s.over) return { ok: false, reason: "本局已结束" };
    if (s.busy) return { ok: false, reason: "正在执行上一步操作" };
    var action = s.actions.find(function (a) { return a.id === actionId; });
    if (!action) return { ok: false, reason: "无此操作" };
    if (action.need_skill && s.ownedSkills.indexOf(action.need_skill) < 0) {
      var sk = DATA.PACK.skills[action.need_skill];
      return { ok: false, reason: "尚未取得该操作的资格（通关本关可获《" + sk.name + "》）" };
    }
    if (action.limit_by && action.remaining <= 0) return { ok: false, reason: "该资源已用尽" };
    if (s.roleData.blind && s.roleData.blind.indexOf("breaker_op") >= 0 && action.op === "breaker") {
      return { ok: false, reason: "无操作权，请联系检修班" };
    }
    if (s.gate && s.gate[actionId] && !s.flags[s.gate[actionId]]) {
      return { ok: false, reason: "主网未恢复，无法并网" };
    }
    if (s.id === 1 && (!extra || !extra.key)) return { ok: false, reason: "请先点击要核对的设备" };
    return { ok: true, cost: costOf(s, action) };
  }

  /* 提交动作：进入执行窗口（busy），dispatch 增加回执延迟 */
  function act(s, actionId, extra) {
    var gate = canAct(s, actionId, extra);
    if (!gate.ok) return gate;
    var action = s.actions.find(function (a) { return a.id === actionId; });
    var cost = gate.cost;

    if (s.id === 1) {
      var item = selectedHandoverItem(s, extra && extra.key);
      if (!item || item.done) return { ok: false, reason: item ? "该项已核对" : "无此项设备" };
      if (actionId === "check") {
        item.done = "ok"; s.handover.checked++;
        if (item.abnormal) { s.handover.misjudge++; s.metrics.mistakes++; }
      } else { /* mark */
        item.done = "mark"; s.handover.checked++;
        if (!item.abnormal) { s.handover.misjudge++; s.metrics.mistakes++; }
        else s.metrics.greenCalls++;
      }
      s.timeUsed += cost; s.timeLeft = Math.max(0, s.timeLeft - cost);
      s.log.push({ t: s.timeUsed, action: actionId, name: action.name });
      return { ok: true, cost: cost };
    }

    var delay = (s.roleData.bonus && s.roleData.bonus.confirm_delay) ? s.roleData.bonus.confirm_delay : 0;
    s.pending = { actionId: actionId, at: s.timeUsed + cost + delay, name: action.name };
    s.busy = s.pending;
    if (action.limit_by) action.remaining--;
    s.log.push({ t: s.timeUsed, action: actionId, name: action.name, queued: true });
    return { ok: true, cost: cost, delay: delay };
  }

  function applyEffect(s, actionId) {
    var action = s.actions.find(function (a) { return a.id === actionId; });
    if (!action) return null;
    var eff = {};
    Object.keys(action.effect || {}).forEach(function (k) {
      var v = action.effect[k];
      var m = s.meters;
      if (k === "soc") m.soc = clamp(m.soc + v, 0, 100);
      else if (m[k] !== undefined) m[k] = (v === 0) ? v : m[k] + v;
      eff[k] = v;
    });
    // 计指标：损失/弃电为失误，绿色调用为加分项
    if (action.effect.load_lost) s.metrics.mistakes += action.effect.load_lost;
    if (action.effect.curtail) s.metrics.mistakes += action.effect.curtail / 4;
    if (actionId === "ess_discharge" || actionId === "ess_support" || actionId === "ess_genset" || actionId === "ancillary") s.metrics.greenCalls++;
    if (actionId === "degrade_realtime" || actionId === "recruit_curt" || actionId === "load_shed" || actionId === "interrupt") s.metrics.mistakes++;
    if (action.effect.availability && action.effect.availability < 0) s.metrics.mistakes++;
    return eff;
  }

  function deriveMeters(s) {
    if (s.id === 9) s.meters.deviation = s.meters.wind_mw - s.meters.plan_mw;
  }

  /* 推进时间：结算窗口 → 漂移/事件 → 判定 */
  function tick(s, dtSec) {
    var events = [];
    if (s.over) return { events: events };
    s.timeUsed += dtSec;
    s.timeLeft = Math.max(0, s.timeLeft - dtSec);
    s.metrics.timeUsed = s.timeUsed;

    if (s.pending && s.timeUsed >= s.pending.at) {
      applyEffect(s, s.pending.actionId);
      deriveMeters(s);
      s.log[s.log.length - 1].queued = false;
      s.pending = null; s.busy = null;
    } else if (s.busy && s.timeUsed >= s.busy.at) {
      s.busy = null;
    }

    var evs = GDW.sim.step(s, dtSec);
    for (var i = 0; i < evs.length; i++) events.push(evs[i]);
    deriveMeters(s);

    if (s.timeLeft <= 0) s.over = true; // 时间耗尽先标记终局（成败由判定确定）

    var fail = evaluateFail(s, dtSec);
    if (fail.triggered) { s.failed = true; s.over = true; events.push(fail.text); }
    evaluateTarget(s, dtSec);
    if (s.over && !s.failed && !s.achieved) { s.failed = true; events.push("时间耗尽，未能达成目标"); }
    return { events: events };
  }

  /* 红线判定：任一 fail 规则触发即失败 */
  function evaluateFail(s, dt) {
    var enr = ENR.levels[s.id];
    if (!enr || !enr.checks) return { triggered: false, text: "" };
    if (s.handover) s.handover.missed = s.handover.items.length - s.handover.checked;
    var rules = enr.checks.fail || [];
    var slack = s.redlineSlack;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i], m = s.meters, c = s.counters;
      if (r.t === "below") {
        var lo = r.v - slackAmount(s, r.meter) * slack;
        if (m[r.meter] < lo) return { triggered: true, text: r.text || ("红线：" + r.meter + " 过低") };
      } else if (r.t === "above") {
        var hi = r.v + slackAmount(s, r.meter) * slack;
        if (m[r.meter] > hi) return { triggered: true, text: r.text || ("红线：" + r.meter + " 越上限") };
      } else if (r.t === "end_below") {
        if (s.over && m[r.meter] < r.v) return { triggered: true, text: r.text || ("结算时 " + r.meter + " 过低") };
      } else if (r.t === "out_of_band") {
        var val = m[r.meter] !== undefined ? m[r.meter] : 0;
        var key = r.meter;
        if (c.out[key] === undefined) c.out[key] = { n: 0, wasOut: false };
        var inBand = val >= r.lo && val <= r.hi;
        if (!inBand && !c.out[key].wasOut) { c.out[key].n++; c.out[key].wasOut = true; s.metrics.bandBreaks++; }
        if (inBand) c.out[key].wasOut = false;
        if (c.out[key].n > r.count + slack) return { triggered: true, text: r.text || (r.meter + " 越限次数过多") };
      } else if (r.t === "flag") {
        if (s.flags[r.flag]) return { triggered: true, text: r.text || "未满足条件就执行了关键操作" };
      } else if (r.t === "sec_out") {
        var total = m[r.total] || 0;
        if (m[r.meter] < total) c.sec[r.meter] = (c.sec[r.meter] || 0) + dt;
        else c.sec[r.meter] = 0;
        if (c.sec[r.meter] > r.sec) return { triggered: true, text: r.text || "关键负荷失电超时" };
      } else if (r.t === "handover") {
        if (s.handover.missed > r.missedGT + slack || s.handover.misjudge > r.misjudgeGT + slack) {
          return { triggered: true, text: "交接班漏检/误判过多" };
        }
      }
    }
    return { triggered: false, text: "" };
  }

  function slackAmount(s, meter) {
    var meta = ENR.meters[meter];
    if (meta) return (meta.range[1] - meta.range[0]) < 6 ? 0.02 : 1;
    return 1;
  }

  /* 目标判定：所有 target 规则满足即达标 */
  function evaluateTarget(s, dt) {
    if (s.over && s.failed) { s.achieved = false; return; }
    var enr = ENR.levels[s.id];
    if (!enr || !enr.checks) return;
    var rules = enr.checks.target || [];
    var m = s.meters, c = s.counters, met = true;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.t === "hold") {
        var key = "hold_" + r.meter;
        if (c.hold[key] === undefined) c.hold[key] = 0;
        if (m[r.meter] >= r.lo && m[r.meter] <= r.hi) c.hold[key] += dt; else c.hold[key] = 0;
        if (c.hold[key] < r.sec) met = false;
      } else if (r.t === "hold_dev") {
        var d = (m[r.meter] - m[r.ref]);
        var k2 = "hold_" + r.meter;
        if (c.hold[k2] === undefined) c.hold[k2] = 0;
        if (d >= r.lo && d <= r.hi) c.hold[k2] += dt; else c.hold[k2] = 0;
        if (c.hold[k2] < r.sec) met = false;
      } else if (r.t === "gte") { if (!(m[r.meter] >= r.v)) met = false; }
      else if (r.t === "lte") { if (!(m[r.meter] <= r.v)) met = false; }
      else if (r.t === "eq") { if (!(Math.abs(m[r.meter] - r.v) < 0.001)) met = false; }
      else if (r.t === "handover_min") { if (s.handover.checked < r.checked) met = false; }
      else { met = false; }
    }
    s.achieved = met;
    if (s.handover) s.handover.missed = s.handover.items.length - s.handover.checked;
  }

  /* 结算 */
  function settle(s) {
    if (!s.over) s.over = true;
    if (s.handover) s.handover.missed = s.handover.items.length - s.handover.checked;
    return {
      id: s.id, name: s.name, role: s.role, achieved: s.achieved, failed: s.failed,
      timeUsed: s.timeUsed, duration: s.duration, metrics: s.metrics, log: s.log
    };
  }

  return { build: build, canAct: canAct, act: act, tick: tick, evaluateFail: evaluateFail, evaluateTarget: evaluateTarget, settle: settle, costOf: costOf };
})();
