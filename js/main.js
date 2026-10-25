/* js/main.js — 启动引导 + 玩法循环状态机（prepare→brief→operate→settle→review） */
window.GDW = window.GDW || {};
window.GDW.main = (function () {
  "use strict";
  var DATA = window.GDW.data, ENR = window.GDW.enrichment;

  var stage = null, hud = null, dock = null, toastEl = null;
  var s = null, opts = null, timer = null, selKey = null, result = null;
  var history = {}, keyMeter = null;

  var KEY_METER = { 2: "bus_voltage", 3: "freq", 4: "t1_load", 5: "section_load", 6: "end_voltage", 7: "soc", 9: "deviation", 10: "response", 11: "freq" };

  function boot() {
    stage = document.getElementById("stage");
    hud = document.getElementById("hud");
    dock = document.getElementById("dock");
    toastEl = document.getElementById("toast");
    showMenu();
  }

  function progress() {
    var p = GDW.state.load();
    p.ownedSkills = GDW.skills.ownedSkills(p);
    return p;
  }

  function ghostState() {
    var prefs = GDW.state.prefs();
    var lv = GDW.state.nextLevel();
    var lvl = DATA.PACK.levels.find(function (x) { return x.id === lv; });
    return GDW.engine.build(lv, { role: lvl.role_hint, difficulty: prefs.difficulty, assist: prefs.assist, skills: GDW.skills.ownedSkills(GDW.state.load()) });
  }

  function showMenu() {
    stopLoop();
    hud.classList.add("hidden");
    dock.innerHTML = "";
    var prefs = GDW.state.prefs();
    var ghost = ghostState();
    GDW.prepare.render(stage, {
      progress: progress(),
      prefs: prefs,
      defaultLevel: GDW.state.nextLevel(),
      setPrefs: function (p) { GDW.state.setPrefs(p); },
      onStart: start,
      onCodex: function () { openCodex(ghost); },
      onReset: function () { GDW.state.reset(); showMenu(); }
    });
  }

  function start(cfg) {
    opts = cfg;
    result = null;
    s = GDW.engine.build(cfg.level, { role: cfg.role, difficulty: cfg.difficulty, assist: cfg.assist, skills: GDW.skills.ownedSkills(GDW.state.load()) });
    s._selectedKey = null;
    var card = DATA.PACK.levels.find(function (l) { return l.id === cfg.level; }).rewards.card;
    s.rewardCard = card;
    GDW.brief.render(stage, s, goOperate);
  }

  function goOperate() {
    hud.classList.remove("hidden");
    history = {};
    keyMeter = KEY_METER[s.id] || Object.keys(s.meters)[0];
    renderHud();
    GDW.dashboard.render(s, stage, onDevice);
    GDW.controls.render(dock, s, { onAct: handleAct, onCodex: openCodex, onSettle: doSettle });
    GDW.fx.startAmbient();
    timer = setInterval(loop, 250);
  }

  function loop() {
    if (!s || s.over) { stopLoop(); if (s && s.over) doSettle(); return; }
    var evs = GDW.engine.tick(s, 0.25);
    if (evs.length) {
      evs.forEach(function (e) { GDW.dashboard.banner(e, s.over ? "critical" : "high"); });
      GDW.dashboard.update(s);
      GDW.controls.refresh(s);
    }
    GDW.dashboard.update(s);
    GDW.dashboard.coach(s);
    pushHistory();
    GDW.dashboard.spark(history[keyMeter] || [], keyMeter);
    GDW.controls.refresh(s);
    renderHud();
    if (s.over) { stopLoop(); doSettle(); }
  }

  function pushHistory() {
    if (!history[keyMeter]) history[keyMeter] = [];
    history[keyMeter].push(s.meters[keyMeter]);
    if (history[keyMeter].length > 80) history[keyMeter].shift();
  }

  function stopLoop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function onDevice(key) {
    if (s && s.id === 1) { selKey = key; s._selectedKey = key; GDW.dashboard.flash(key); GDW.controls.refresh(s); }
  }

  function handleAct(actionId) {
    if (!s || s.over) return;
    var x = s.id === 1 ? { key: selKey } : undefined;
    var g = GDW.engine.canAct(s, actionId, x);
    if (!g.ok) {
      GDW.fx.deny(); GDW.fx.vibrate(20);
      toast(g.reason, "bad");
      GDW.controls.refresh(s);
      return;
    }
    var r = GDW.engine.act(s, actionId, x);
    GDW.fx.click();
    var action = s.actions.find(function (a) { return a.id === actionId; });
    if (action && action.dev) GDW.dashboard.flash(action.dev);
    if (r.delay) { toast("指令已下达，等待调度回执 " + r.delay + "s", "info"); GDW.fx.ack(); }
    if (s.id === 1) { selKey = null; s._selectedKey = null; }
    GDW.controls.refresh(s);
  }

  function handleHint(tier) {
    if (!s || s.over) return;
    var v = GDW.hints.view(s, tier);
    s.timeLeft = Math.max(0, s.timeLeft - v.cost);
    s.metrics.hintCost += v.cost;
    GDW.fx.click();
    toast((v.text || "查看对应设备高亮") + (v.cost ? "（-" + v.cost + "s）" : ""), "info");
    if (v.deviceId) GDW.dashboard.flash(v.deviceId);
    renderHud();
  }

  function openCodex(anyState) {
    var target = anyState || s;
    if (!target) return;
    GDW.codex.render(stage, { s: target, progress: progress(), onClose: function () { if (s && !s.over) goOperateContinue(); else showMenu(); }, onHint: handleHint });
  }

  function goOperateContinue() {
    hud.classList.remove("hidden");
    stage.innerHTML = "";
    GDW.dashboard.render(s, stage, onDevice);
    GDW.controls.render(dock, s, { onAct: handleAct, onCodex: openCodex, onSettle: doSettle });
  }

  function doSettle() {
    stopLoop();
    var st = GDW.engine.settle(s);
    result = GDW.scoring.compute(s, st, false);
    if (result.stars > 0) GDW.fx.success();
    GDW.state.record(s.id, { achieved: st.achieved, stars: result.stars, timeUsed: st.timeUsed, credit: result.credit, card: s.rewardCard });
    hud.classList.add("hidden");
    dock.innerHTML = "";
    GDW.settle.render(stage, {
      s: s, result: result,
      onReview: goReview,
      onRetry: retry,
      onMenu: showMenu
    });
  }

  function goReview() {
    GDW.review.render(stage, {
      s: s, progress: progress(),
      onDone: showMenu,
      onRetry: retry,
      onQuiz: handleQuiz
    });
  }

  function handleQuiz(correct) {
    if (!correct || !result || result.stars >= 3) return;
    var r2 = GDW.scoring.compute(s, GDW.engine.settle(s), true);
    if (r2.stars > result.stars) {
      result = r2;
      GDW.state.bumpStars(s.id, r2.stars);
      toast("三星达成！学分 +" + r2.credit, "good");
    }
  }

  function retry() { start(opts); }

  function toast(msg, kind) {
    if (!toastEl) return;
    toastEl.innerHTML = '<div class="toast ' + (kind || "info") + '">' + msg + "</div>";
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  function renderHud() {
    if (!hud || !s) return;
    var p = ENR.persona[s.role];
    hud.innerHTML =
      '<span class="hud-name">第 ' + s.id + " 关 · " + s.name + "</span>" +
      '<span class="hud-role">' + p.nameplate + "</span>" +
      '<span class="hud-clock">⏱ ' + Math.ceil(s.timeLeft) + "s / " + s.duration + "s</span>" +
      '<span class="hud-used">已用 ' + Math.round(s.timeUsed) + "s</span>";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  return { boot: boot };
})();
