/* js/ui/codex.js — 值班手册：知识/技能/操作三级提示 + 知识卡/技能/角色图鉴 */
window.GDW = window.GDW || {};
window.GDW.codex = (function () {
  "use strict";
  var ENR = window.GDW.enrichment, DATA = window.GDW.data;

  function render(root, ctx) {
    var s = ctx.s, progress = ctx.progress;
    root.innerHTML = "";
    var modal = document.createElement("div");
    modal.className = "codex-modal";

    var head = document.createElement("div");
    head.className = "codex-head";
    head.innerHTML = '<span>值班手册</span><button class="codex-close" data-act="close">×</button>';
    modal.appendChild(head);

    var tabs = document.createElement("div");
    tabs.className = "codex-tabs";
    var panels = {};
    [["hint", "提示"], ["card", "知识卡"], ["skill", "技能"], ["role", "角色"]].forEach(function (t) {
      var b = document.createElement("button");
      b.dataset.tab = t[0];
      b.textContent = t[1];
      tabs.appendChild(b);
      var p = document.createElement("div");
      p.className = "codex-panel";
      modal.appendChild(p);
      panels[t[0]] = p;
    });
    modal.appendChild(tabs);

    function show(tab) {
      Object.keys(panels).forEach(function (k) { panels[k].classList.toggle("active", k === tab); });
      tabs.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x.dataset.tab === tab); });
    }

    /* 提示面板 */
    var h = ENR.levels[s.id].hints;
    var hp = panels.hint;
    [["know", "知识提示（原理）", h.know[0]], ["skill", "技能提示（本关技能）", h.skill[0]], ["op", "操作提示（怎么做）", ""]].forEach(function (t) {
      var row = document.createElement("div");
      row.className = "hint-row";
      var cost = GDW.hints.cost(s, t[0]);
      row.innerHTML = '<div class="hint-k">' + t[1] + "</div><div class=\"hint-d\">" + (t[2] || "（查看后显示操作序列/设备高亮）") + "</div>";
      var btn = document.createElement("button");
      btn.className = "btn small";
      btn.textContent = cost > 0 ? "查看（-" + cost + "s）" : "查看";
      btn.addEventListener("click", function () { ctx.onHint(t[0]); });
      row.appendChild(btn);
      hp.appendChild(row);
    });

    /* 知识卡面板 */
    var ownedCards = Object.keys(progress.cards || {});
    if (s.rewardCard && ownedCards.indexOf(s.rewardCard) < 0) ownedCards.push(s.rewardCard);
    var cp = panels.card;
    (ownedCards.length ? ownedCards : ["交接班制度为什么要签字"]).forEach(function (c) {
      var item = document.createElement("div");
      item.className = "codex-item";
      var full = ENR.cards[c] || "";
      item.innerHTML = '<div class="codex-item-title">📕 ' + c + "</div><div class=\"codex-item-body\">" + full + "</div>";
      cp.appendChild(item);
    });

    /* 技能面板 */
    Object.keys(DATA.PACK.skills).forEach(function (sk) {
      var sko = DATA.PACK.skills[sk];
      var owned = progress.ownedSkills.indexOf(sk) >= 0;
      var item = document.createElement("div");
      item.className = "codex-item" + (owned ? "" : " locked");
      item.innerHTML = '<div class="codex-item-title">' + (owned ? "✓ " : "🔒 ") + sko.name +
        " <span class=\"codex-sub\">（通关第 " + sko.from_level + " 关解锁）</span></div>" +
        '<div class="codex-item-body">' + sko.effect + "</div>";
      panels.skill.appendChild(item);
    });

    /* 角色面板 */
    Object.keys(DATA.PACK.roles).forEach(function (rk) {
      var r = DATA.PACK.roles[rk], p = ENR.persona[rk];
      var item = document.createElement("div");
      item.className = "codex-item";
      item.innerHTML = '<div class="codex-item-title">' + p.nameplate + "</div>" +
        '<div class="codex-item-body">' + r.desc + "<br>" + GDW.roles.bonusText(rk) + "</div>";
      panels.role.appendChild(item);
    });

    show("hint");
    tabs.addEventListener("click", function (e) {
      var t = e.target.closest("button");
      if (t && t.dataset.tab) show(t.dataset.tab);
    });
    modal.addEventListener("click", function (e) {
      if (e.target.closest(".codex-close")) ctx.onClose();
    });
    root.appendChild(modal);
  }

  return { render: render };
})();
