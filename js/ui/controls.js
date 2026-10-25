/* js/ui/controls.js — 动作台：按钮渲染/门禁/冷却/交班结算/值班手册入口 */
window.GDW = window.GDW || {};
window.GDW.controls = (function () {
  "use strict";
  var dockEl = null, btnMap = {}, settleBtn = null;

  function hasSkill(s, sk) { return s.ownedSkills.indexOf(sk) >= 0; }

  function buildBtn(s, a, ctx) {
    var b = document.createElement("button");
    b.className = "act-btn";
    b.dataset.act = a.id;
    var skillBadge = a.need_skill ? '<span class="act-skill">' + (hasSkill(s, a.need_skill) ? "✓" : "🔒") + "</span>" : "";
    var limit = a.limit_by ? '<span class="act-limit" data-limit="' + a.id + '">剩' + a.remaining + "</span>" : "";
    b.innerHTML = skillBadge + '<span class="act-name">' + a.name + '</span><span class="act-cost">' + a.cost + "s</span>" + limit;
    b.addEventListener("click", function () { ctx.onAct(a.id); });
    return b;
  }

  function render(root, s, ctx) {
    root.innerHTML = "";
    dockEl = document.createElement("div");
    dockEl.className = "action-dock";
    btnMap = {};
    s.actions.forEach(function (a) {
      var b = buildBtn(s, a, ctx);
      dockEl.appendChild(b);
      btnMap[a.id] = b;
    });
    root.appendChild(dockEl);

    var row = document.createElement("div");
    row.className = "dock-row";
    var hintBtn = document.createElement("button");
    hintBtn.className = "btn secondary";
    hintBtn.textContent = "值班手册（提示）";
    hintBtn.addEventListener("click", function () { ctx.onCodex(); });
    row.appendChild(hintBtn);
    settleBtn = document.createElement("button");
    settleBtn.className = "btn primary";
    settleBtn.textContent = "交班结算";
    settleBtn.addEventListener("click", function () { ctx.onSettle(); });
    row.appendChild(settleBtn);
    root.appendChild(row);

    refresh(s);
  }

  function refresh(s) {
    if (!dockEl) return;
    var i, a, b, g, x;
    for (i = 0; i < s.actions.length; i++) {
      a = s.actions[i];
      b = btnMap[a.id];
      if (!b) continue;
      x = (s.id === 1) ? { key: s._selectedKey } : undefined;
      g = GDW.engine.canAct(s, a.id, x);
      b.classList.toggle("disabled", !g.ok);
      b.title = g.ok ? "" : g.reason;
      if (a.limit_by) {
        var lim = b.querySelector('[data-limit="' + a.id + '"]');
        if (lim) lim.textContent = "剩" + a.remaining;
      }
    }
    if (s.id === 1 && s._selectedKey) {
      Object.keys(btnMap).forEach(function (k) { btnMap[k].classList.add("has-target"); });
    }
    if (settleBtn) {
      settleBtn.disabled = s.over || (!s.achieved && s.timeUsed < 5);
      settleBtn.textContent = s.achieved ? "交班结算 ✓" : "交班结算";
    }
    if (s.busy) {
      Object.keys(btnMap).forEach(function (k) { btnMap[k].title = "正在执行上一步操作"; });
    }
  }

  return { render: render, refresh: refresh };
})();
