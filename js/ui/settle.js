/* js/ui/settle.js — 结算卡：四维得分/星级/学分/知识卡/角色点评 */
window.GDW = window.GDW || {};
window.GDW.settle = (function () {
  "use strict";
  var ENR = window.GDW.enrichment;

  function bar(label, v) {
    var pct = Math.round(Math.max(0, Math.min(1, v)) * 100);
    return '<div class="dim"><div class="dim-label">' + label + "</div>" +
      '<div class="dim-bar"><i style="width:' + pct + '%"></i></div><span class="dim-val">' + pct + "</span></div>";
  }

  function stars(n) {
    var s = "";
    for (var i = 1; i <= 3; i++) s += '<span class="star' + (i <= n ? " on" : "") + '">★</span>';
    return s;
  }

  function render(root, ctx) {
    var s = ctx.s, r = ctx.result;
    root.innerHTML = "";
    var panel = document.createElement("div");
    panel.className = "settle-panel " + (s.achieved ? "win" : "lose");

    panel.innerHTML =
      '<div class="settle-title">' + (s.achieved ? "值班完成 · 目标达成" : "值班失败 · 红线触发") + "</div>" +
      '<div class="settle-stars">' + stars(r.stars) + "</div>" +
      '<div class="settle-score">' + Math.round(r.total * 100) + "</div>" +
      '<div class="settle-dims">' +
        bar("安全", r.safety) + bar("经济", r.economy) + bar("绿色", r.green) + bar("效率", r.efficiency) +
      "</div>" +
      '<div class="settle-credit">+ ' + r.credit + " 学分</div>";

    var card = s.rewardCard;
    if (s.achieved && card) {
      var c = document.createElement("div");
      c.className = "card-flip";
      c.innerHTML = '<div class="cf-front">📕 ' + card + "</div><div class=\"cf-back\">" + ENR.cards[card] + "</div>";
      panel.appendChild(c);
    }

    var v = document.createElement("div");
    v.className = "settle-verdict";
    v.textContent = GDW.persona.verdict(s.role, s.achieved);
    panel.appendChild(v);

    var foot = document.createElement("div");
    foot.className = "settle-foot";
    foot.innerHTML =
      (s.achieved ? '<button class="btn primary" data-act="review">复盘 & 三星答题</button>' : '<button class="btn primary" data-act="retry">重试</button>') +
      '<button class="btn ghost" data-act="menu">回准备页</button>';
    foot.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      var act = btn ? btn.dataset.act : null;
      if (act === "review") ctx.onReview();
      else if (act === "retry") ctx.onRetry();
      else if (act === "menu") ctx.onMenu();
    });
    panel.appendChild(foot);
    root.appendChild(panel);
  }

  return { render: render };
})();
