/* tests/engine.test.js — 通用引擎断言：构建/门禁/成本/回执/hold/红线/交接班/评分/提示 */
"use strict";
var h = require("./harness");
h.loadAll();
var GDW = h.GDW();
var E = GDW.engine, DATA = GDW.data, ENR = GDW.enrichment;

var pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log("  ok -", msg); }
  else { fail++; console.error("  FAIL -", msg); }
}

/* 执行动作序列：动作落地 = act + tick 推进到 pending 结算；wait 为纯等待 */
function runLevel(seq, opts) {
  var s = E.build(opts.id, { role: opts.role, difficulty: opts.difficulty || "standard", assist: opts.assist || "balanced", skills: opts.skills || [] });
  seq.forEach(function (step) {
    if (s.over) return;
    if (step.wait) {
      var t = step.wait;
      while (t > 0 && !s.over) { E.tick(s, Math.min(0.25, t)); t -= 0.25; }
    } else {
      var g = E.canAct(s, step.a, step.x);
      if (!g.ok) { s._reason = g.reason; return; }
      E.act(s, step.a, step.x);
      var guard = 0;
      while ((s.pending || s.busy) && guard < 400 && !s.over) { E.tick(s, 0.25); guard++; }
    }
  });
  E.tick(s, 0.25);
  return { s: s, achieved: s.achieved, failed: s.failed, timeUsed: s.timeUsed, reason: s._reason };
}

/* 构建与基础 */
var s2 = E.build(2, { role: "duty", difficulty: "standard" });
ok(s2.duration === 90, "L2 标准难度 duration=90");
ok(Math.abs(s2.meters.bus_voltage - 0.94) < 1e-9, "L2 初始母线电压 0.94");
ok(E.costOf(s2, s2.actions[0]) === 4, "duty 角色 cap_on 成本 5×0.8=4");

/* 资源上限 */
var use4 = runLevel([{ a: "cap_on" }, { a: "cap_on" }, { a: "cap_on" }, { a: "cap_on" }], { id: 2, role: "duty" });
ok(use4.s.actions[0].remaining === 0, "cap_on 用 4 次后剩余 0（cap_banks 上限）");
ok(E.canAct(use4.s, "cap_on").ok === false, "第 5 次 cap_on 被拒（资源用尽）");

/* 技能门禁 */
var g3 = E.canAct(E.build(3, { role: "re_ops", skills: [] }), "ess_discharge");
ok(!g3.ok && g3.reason.indexOf("资格") >= 0, "L3 无 grid_tie 时 ess_discharge 被门禁");
ok(E.canAct(E.build(3, { role: "re_ops", skills: ["grid_tie"] }), "ess_discharge").ok === true, "持有 grid_tie 后 ess_discharge 可用");

/* 角色盲区 */
ok(!E.canAct(E.build(4, { role: "relay" }), "bus_couple").ok, "relay 盲区：bus_couple（一次设备）被拒");
ok(E.canAct(E.build(4, { role: "dispatch" }), "bus_couple").ok === true, "dispatch 可执行 bus_couple");

/* dispatch 回执延迟 */
var s4d = E.build(4, { role: "dispatch" });
E.act(s4d, "reconfig");
var guard = 0;
while ((s4d.pending || s4d.busy) && guard < 300) { E.tick(s4d, 1); guard++; }
ok(s4d.meters.t1_load >= 90 && s4d.meters.t1_load <= 91.5, "dispatch reconfig 落地后 t1_load≈90（含负载漂移）");
ok(guard >= 17, "回执+执行总耗时 ≥17s（cost14+delay3）");

/* hold 目标（L2） */
var r2 = runLevel([{ a: "cap_on" }, { a: "cap_on" }, { wait: 21 }], { id: 2, role: "duty" });
ok(r2.achieved === true, "L2 cap_on×2 + 保持 20s → 达成");

/* 红线（电压越上限） */
var rL2f = runLevel([{ a: "cap_on" }, { a: "cap_on" }, { a: "cap_on" }, { a: "cap_on" }, { a: "shed" }, { a: "tap_up" }, { a: "tap_up" }, { a: "tap_up" }, { a: "tap_up" }], { id: 2, role: "duty" });
ok(rL2f.failed === true, "L2 电压顶到 1.06 触发红线失败");

/* L1 交接班 */
var s1 = E.build(1, { role: "duty" });
["bus_voltage", "oil_temp", "dc_voltage", "ups_ok", "fire_ok"].forEach(function (k) { E.act(s1, "check", { key: k }); });
E.act(s1, "mark", { key: "alarms" });
E.tick(s1, 0.25);
ok(s1.achieved === true, "L1 六项核对（告警标记异常）→ 达成");
ok(s1.handover.misjudge === 0, "L1 无误判");
var s1b = E.build(1, { role: "duty" });
E.act(s1b, "mark", { key: "bus_voltage" });
ok(s1b.handover.misjudge === 1, "L1 误判计数正确");

/* 评分 */
var sc = GDW.scoring.compute(r2.s, GDW.engine.settle(r2.s), true);
ok(sc.stars >= 1, "L2 通关 ≥1 星");
ok(sc.credit >= 15, "L2 学分 ≥15");

/* 提示代价（辅助档 + 难度档） */
var sStd = E.build(2, { role: "duty", difficulty: "standard", assist: "balanced" });
ok(GDW.hints.cost(sStd, "know") === 0 && GDW.hints.cost(sStd, "skill") === 3, "平衡档：知识免费、技能扣 3s");
var sExp = E.build(2, { role: "duty", difficulty: "expert", assist: "challenge" });
ok(GDW.hints.cost(sExp, "know") === 6, "专家×挑战：知识提示扣 3×2=6s");
ok(GDW.hints.guide(sStd).text.length > 0, "guide() 返回提示文案");

console.log("\nengine.test.js 结果：" + pass + " 通过 / " + fail + " 失败");
process.exit(fail > 0 ? 1 : 0);
