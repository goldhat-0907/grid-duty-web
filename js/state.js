/* js/state.js — 进度/角色/技能/学分/知识卡/图鉴 + 身份/难度/辅助档（localStorage）+ 解锁逻辑 */
window.GDW = window.GDW || {};
window.GDW.state = (function () {
  "use strict";
  var KEY = "grid-duty-web.progress.v2";
  var DEFAULT = {
    cleared: {}, stars: {}, best: {},
    credits: 0, cards: {},
    prefs: { role: "auto", difficulty: "standard", assist: "balanced", volume: 0.6 }
  };
  var data = null;

  function load() {
    if (data) return data;
    var parsed = null;
    try { parsed = JSON.parse(window.localStorage.getItem(KEY)); } catch (e) { parsed = null; }
    data = parsed || JSON.parse(JSON.stringify(DEFAULT));
    return data;
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(load())); } catch (e) { }
  }

  function cleared(id) { return !!load().cleared[id]; }
  function starsOf(id) { return load().stars[id] || 0; }
  function credits() { return load().credits || 0; }
  function prefs() { return load().prefs; }
  function setPrefs(p) {
    var d = load();
    var k;
    for (k in p) if (Object.prototype.hasOwnProperty.call(p, k)) d.prefs[k] = p[k];
    save();
  }

  function ownedSkills() { return GDW.skills.ownedSkills(load()); }
  function unlockedRoles() { return GDW.roles.unlockedRoles(load()); }

  function nextLevel() {
    var d = load(), n = 1;
    for (var i = 1; i <= 11; i++) if (d.cleared[i]) n = i + 1;
    return Math.min(n, 11);
  }

  /* 记录一局结果：achieved → 通关/星级/最佳/学分/知识卡 */
  function record(levelId, result) {
    var d = load();
    if (result.achieved) {
      d.cleared[levelId] = true;
      d.stars[levelId] = Math.max(d.stars[levelId] || 0, result.stars || 0);
      if (d.best[levelId] === undefined || result.timeUsed < d.best[levelId]) d.best[levelId] = result.timeUsed;
      d.credits = (d.credits || 0) + (result.credit || 0);
      if (result.card) d.cards[result.card] = true;
      save();
    }
    return d;
  }

  /* 三星答题后升级星级（不重复加学分） */
  function bumpStars(levelId, stars) {
    var d = load();
    if ((d.stars[levelId] || 0) < stars) { d.stars[levelId] = stars; save(); }
  }

  function reset() {
    data = null;
    try { window.localStorage.removeItem(KEY); } catch (e) { }
    data = JSON.parse(JSON.stringify(DEFAULT));
  }

  return {
    load: load, save: save, cleared: cleared, starsOf: starsOf, credits: credits,
    prefs: prefs, setPrefs: setPrefs, ownedSkills: ownedSkills, unlockedRoles: unlockedRoles,
    nextLevel: nextLevel, record: record, bumpStars: bumpStars, reset: reset
  };
})();
