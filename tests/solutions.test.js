/* tests/solutions.test.js — 11 关逐关求解：可行解耗时≤duration + BFS 自动搜索 + 负路径 */
"use strict";
var h = require("./harness");
h.loadAll();
var GDW = h.GDW();
var E = GDW.engine;

var pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log("  ok -", msg); }
  else { fail++; console.error("  FAIL -", msg); }
}

function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* 执行一步：动作 → act + tick 推进到结算；wait → 纯等待 */
function applyMove(s, mv) {
  if (mv.wait) {
    var t = mv.wait;
    while (t > 0 && !s.over) { E.tick(s, Math.min(0.25, t)); t -= 0.25; }
  } else {
    var g = E.canAct(s, mv.a, mv.x);
    if (!g.ok) return false;
    E.act(s, mv.a, mv.x);
    var guard = 0;
    while ((s.pending || s.busy) && guard < 400 && !s.over) { E.tick(s, 0.25); guard++; }
  }
  return true;
}

/* 执行序列并返回结果 */
function runSeq(levelId, seq, opts) {
  var s = E.build(levelId, { role: opts.role, difficulty: "standard", assist: "balanced", skills: opts.skills || [] });
  seq.forEach(function (mv) { if (!s.over && !s.achieved) applyMove(s, mv); });
  if (!s.over && !s.achieved) E.tick(s, 0.25);
  return { s: s, achieved: s.achieved, failed: s.failed, timeUsed: s.timeUsed };
}

function signature(s) {
  var keys = Object.keys(s.meters).sort();
  var m = keys.map(function (k) { return k + ":" + Math.round(s.meters[k] * 100) / 100; }).join(",");
  var extra = "t" + Math.round(s.timeUsed / 5) + "|" + (s.handover ? s.handover.items.map(function (i) { return i.done || "-"; }).join("") : "");
  var f = Object.keys(s.flags).filter(function (k) { return s.flags[k]; }).join(",");
  return m + "|" + extra + "|" + f;
}

/* BFS 自动求解：节点预算内寻找可行序列 */
function solveBFS(levelId, opts, budget) {
  var s0 = E.build(levelId, { role: opts.role, difficulty: "standard", assist: "balanced", skills: opts.skills || [] });
  var queue = [{ s: s0, seq: [] }];
  var seen = {};
  var nodes = 0;
  while (queue.length && nodes < budget) {
    var cur = queue.shift(); nodes++;
    if (cur.s.over) { if (cur.s.achieved) return { seq: cur.seq, timeUsed: cur.s.timeUsed }; continue; }
    var moves = [];
    if (cur.s.id === 1) {
      cur.s.handover.items.forEach(function (it) {
        if (it.done) return;
        cur.s.actions.forEach(function (a) { if (E.canAct(cur.s, a.id, { key: it.key }).ok) moves.push({ a: a.id, x: { key: it.key } }); });
      });
    } else {
      cur.s.actions.forEach(function (a) { if (E.canAct(cur.s, a.id).ok) moves.push({ a: a.id }); });
    }
    [8, 16].forEach(function (w) { moves.push({ wait: w }); });
    for (var i = 0; i < moves.length; i++) {
      var ns = clone(cur.s);
      if (!applyMove(ns, moves[i])) continue;
      var sig = signature(ns);
      if (seen[sig]) continue;
      seen[sig] = 1;
      var nsSeq = cur.seq.concat([moves[i]]);
      if (ns.achieved) return { seq: nsSeq, timeUsed: ns.timeUsed };
      if (nsSeq.length <= 10 && queue.length < budget) queue.push({ s: ns, seq: nsSeq });
    }
  }
  return null;
}

/* 已知可行解（数据包校验精神：存在解且耗时 ≤ duration） */
var KNOWN = {
  1: { role: "duty", skills: [], seq: [{ a: "check", x: { key: "bus_voltage" } }, { a: "check", x: { key: "oil_temp" } }, { a: "check", x: { key: "dc_voltage" } }, { a: "check", x: { key: "ups_ok" } }, { a: "check", x: { key: "fire_ok" } }, { a: "mark", x: { key: "alarms" } }] },
  2: { role: "duty", skills: [], seq: [{ a: "cap_on" }, { a: "cap_on" }, { wait: 21 }] },
  3: { role: "re_ops", skills: [], seq: [{ a: "reserve_on" }, { a: "unit_up" }, { wait: 11 }] },
  4: { role: "dispatch", skills: [], seq: [{ a: "bus_couple" }, { a: "bus_couple" }, { wait: 15 }] },
  5: { role: "dispatch", skills: [], seq: [{ a: "ess_support" }, { a: "ess_support" }, { a: "accept_task" }, { a: "accept_task" }, { wait: 6 }] },
  6: { role: "re_ops", skills: [], seq: [{ a: "reactor_on" }, { a: "reactor_on" }, { a: "reactor_on" }, { wait: 12 }] },
  7: { role: "ess", skills: [], seq: [{ a: "charge" }, { a: "charge" }, { a: "discharge" }, { a: "discharge" }, { wait: 5 }] },
  8: { role: "dispatch", skills: [], seq: [{ wait: 11 }, { a: "isolate" }, { a: "transfer" }, { wait: 12 }, { a: "isolate" }, { a: "transfer" }, { wait: 12 }, { a: "isolate" }, { a: "transfer" }, { wait: 30 }] },
  9: { role: "re_ops", skills: [], seq: [{ a: "ess_discharge" }, { wait: 16 }] },
  10: { role: "vpp", skills: [], seq: [{ a: "recruit_ev" }, { a: "recruit_ev" }, { a: "recruit_ess" }, { a: "recruit_hvac" }, { wait: 5 }] },
  11: { role: "dispatch", skills: ["microgrid_ops"], seq: [{ a: "genset_on" }, { a: "ess_discharge" }, { a: "ess_discharge" }, { wait: 35 }, { wait: 31 }, { a: "check_sync" }, { a: "reconnect" }, { wait: 2 }] }
};

Object.keys(KNOWN).forEach(function (lvId) {
  var lv = parseInt(lvId, 10);
  var k = KNOWN[lvId];
  var lvl = GDW.data.PACK.levels.find(function (x) { return x.id === lv; });
  var r = runSeq(lv, k.seq, k);
  ok(r.achieved === true, "L" + lv + " 存在可行解并达成");
  ok(r.timeUsed <= lvl.duration, "L" + lv + " 可行解耗时 " + Math.round(r.timeUsed) + "s ≤ duration " + lvl.duration + "s");

  /* 自动化 BFS 搜索（预算内） */
  var b = solveBFS(lv, k, 4000);
  ok(!!b && b.timeUsed <= lvl.duration, "L" + lv + " BFS 自动求解出可行序列" + (b ? "（" + b.seq.length + " 步，" + Math.round(b.timeUsed) + "s）" : "（未找到）"));

  /* 负路径：不做任何操作 → 超时失败 */
  var s0 = E.build(lv, { role: k.role, skills: k.skills || [] });
  var guard = 0;
  while (!s0.over && guard < 5000) { E.tick(s0, 0.25); guard++; }
  ok(s0.failed === true, "L" + lv + " 不做操作会超时失败（负路径）");
});

console.log("\nsolutions.test.js 结果：" + pass + " 通过 / " + fail + " 失败");
process.exit(fail > 0 ? 1 : 0);
