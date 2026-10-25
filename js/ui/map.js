/* js/ui/map.js — 值班地图/关卡时间线 + 关卡卡 */
window.GDW = window.GDW || {};
window.GDW.map = (function () {
  "use strict";
  var DATA = window.GDW.data, ENR = window.GDW.enrichment;

  function starsText(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += "★";
    return s || "☆☆☆";
  }

  function maxCleared(progress) {
    var m = 0;
    Object.keys(progress.cleared || {}).forEach(function (k) { if (+k > m) m = +k; });
    return m;
  }

  function unlocked(id, progress) { return id <= maxCleared(progress) + 1; }

  function timeline(el, progress, onPick) {
    el.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "map-timeline";
    DATA.PACK.levels.forEach(function (lv) {
      var open = unlocked(lv.id, progress);
      var node = document.createElement("button");
      node.className = "map-node" + (progress.cleared[lv.id] ? " done" : "") + (open ? "" : " locked");
      node.innerHTML =
        '<span class="node-n">' + lv.id + "</span>" +
        '<span class="node-name">' + lv.name + "</span>" +
        '<span class="node-stars">' + starsText(progress.stars[lv.id] || 0) + "</span>";
      node.disabled = !open;
      node.addEventListener("click", function () { onPick(lv.id); });
      wrap.appendChild(node);
    });
    el.appendChild(wrap);
  }

  function levelCard(el, lv, progress) {
    el.innerHTML = "";
    var card = document.createElement("div");
    card.className = "level-card";
    var skill = lv.rewards.skills[0];
    var sk = DATA.PACK.skills[skill];
    card.innerHTML =
      '<div class="lc-top"><span class="lc-sec">' + lv.section + "</span><span class=\"lc-diff\">难度 " + "●".repeat(lv.difficulty) + "</span></div>" +
      "<div class=\"lc-name\">第 " + lv.id + " 关 · " + lv.name + "</div>" +
      '<div class="lc-target">' + lv.target + "</div>" +
      '<div class="lc-meta">时长 ' + lv.duration + "s ｜ 角色 " + ENR.persona[lv.role_hint].nameplate + " ｜ 星级 " + starsText(progress.stars[lv.id] || 0) + "</div>" +
      '<div class="lc-reward">通关奖励：《' + (sk ? sk.name : "") + "》 + 知识卡</div>";
    el.appendChild(card);
  }

  return { starsText: starsText, timeline: timeline, levelCard: levelCard, unlocked: unlocked };
})();
