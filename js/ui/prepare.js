/* js/ui/prepare.js — 进局前设置：主菜单 + 身份/关卡/难度/辅助 四步 */
window.GDW = window.GDW || {};
window.GDW.prepare = (function () {
  "use strict";
  var DATA = window.GDW.data, ENR = window.GDW.enrichment;

  function picker(label, options, current, onChange) {
    var box = document.createElement("div");
    box.className = "pick-field";
    box.innerHTML = '<div class="pf-label">' + label + "</div>";
    var row = document.createElement("div");
    row.className = "pick-row";
    options.forEach(function (o) {
      var b = document.createElement("button");
      b.className = "pick-btn" + (o.value === current ? " on" : "");
      b.innerHTML = o.title + (o.sub ? '<span class="pick-sub">' + o.sub + "</span>" : "");
      b.addEventListener("click", function () {
        row.querySelectorAll(".pick-btn").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        onChange(o.value);
      });
      row.appendChild(b);
    });
    box.appendChild(row);
    return box;
  }

  function render(root, ctx) {
    var progress = ctx.progress;
    var prefs = ctx.prefs;
    var picked = { level: ctx.defaultLevel, role: null, difficulty: prefs.difficulty, assist: prefs.assist };
    var refresh = function () {};

    root.innerHTML = "";
    var screen = document.createElement("div");
    screen.className = "prepare-screen";
    screen.innerHTML =
      '<div class="p-title"><span class="p-title-main">电网值班室</span><span class="p-title-sub">算电协同 · 沉浸式值班教学</span></div>';

    var timelineWrap = document.createElement("div");
    timelineWrap.className = "p-section";
    timelineWrap.innerHTML = '<div class="p-sec-title">① 今夜值守时间线 · 选择关卡</div>';
    screen.appendChild(timelineWrap);

    var mapEl = document.createElement("div");
    timelineWrap.appendChild(mapEl);
    GDW.map.timeline(mapEl, progress, function (id) {
      picked.level = id;
      picked.role = null;
      refresh();
    });

    var cardEl = document.createElement("div");
    cardEl.className = "p-section";
    screen.appendChild(cardEl);

    var roleEl = document.createElement("div");
    roleEl.className = "p-section";
    screen.appendChild(roleEl);

    var diffEl = document.createElement("div");
    diffEl.className = "p-section";
    diffEl.innerHTML = '<div class="p-sec-title">③ 难度档</div>';
    screen.appendChild(diffEl);

    var assistEl = document.createElement("div");
    assistEl.className = "p-section";
    assistEl.innerHTML = '<div class="p-sec-title">④ 知识/技能辅助档</div>';
    screen.appendChild(assistEl);

    var footer = document.createElement("div");
    footer.className = "p-footer";
    footer.innerHTML =
      '<button class="btn secondary" data-act="codex">值班手册</button>' +
      '<button class="btn ghost" data-act="reset">重置进度</button>' +
      '<button class="btn primary big" data-act="go">上岗</button>';
    screen.appendChild(footer);

    refresh = function () {
      var lv = DATA.PACK.levels.find(function (x) { return x.id === picked.level; });
      cardEl.innerHTML = "";
      GDW.map.levelCard(cardEl, lv, progress);

      var roles = GDW.roles.unlockedRoles(progress);
      var defRole = (lv.role_hint && roles.indexOf(lv.role_hint) >= 0) ? lv.role_hint : roles[0];
      if (!picked.role || roles.indexOf(picked.role) < 0) picked.role = defRole;
      roleEl.innerHTML = '<div class="p-sec-title">② 扮演身份（选角色）<span class="p-sec-hint">首通按推荐锁定，重玩可自由换角</span></div>';
      var rrow = document.createElement("div");
      rrow.className = "role-row";
      roles.forEach(function (rk) {
        var r = DATA.PACK.roles[rk], p = ENR.persona[rk];
        var b = document.createElement("button");
        b.className = "role-card" + (rk === picked.role ? " on" : "");
        b.innerHTML = '<span class="rc-name">' + p.nameplate + "</span>" +
          '<span class="rc-bonus">' + GDW.roles.bonusText(rk) + "</span>" +
          '<span class="rc-desc">' + r.desc + "</span>";
        b.addEventListener("click", function () { picked.role = rk; refresh(); });
        rrow.appendChild(b);
      });
      roleEl.appendChild(rrow);

      diffEl.innerHTML = '<div class="p-sec-title">③ 难度档</div>';
      ["rookie", "standard", "expert"].forEach(function (d) {
        diffEl.appendChild(picker("", [{ title: ENR.presets.difficulty[d].label + "：" + ENR.presets.difficulty[d].desc, value: d }], picked.difficulty, function (v) { picked.difficulty = v; }));
      });

      assistEl.innerHTML = '<div class="p-sec-title">④ 知识/技能辅助档</div>';
      ["guided", "balanced", "challenge"].forEach(function (a) {
        assistEl.appendChild(picker("", [{ title: ENR.presets.assist[a].label + "：" + ENR.presets.assist[a].desc, value: a }], picked.assist, function (v) { picked.assist = v; }));
      });

      footer.querySelector('[data-act="go"]').textContent = "上岗值班 · " + lv.name;
    };

    footer.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      var act = btn ? btn.dataset.act : null;
      if (act === "go") {
        ctx.setPrefs({ role: picked.role, difficulty: picked.difficulty, assist: picked.assist });
        ctx.onStart({ level: picked.level, role: picked.role, difficulty: picked.difficulty, assist: picked.assist });
      } else if (act === "codex") {
        ctx.onCodex();
      } else if (act === "reset") {
        if (confirm("确定重置全部进度与设置？此操作不可撤销。")) { ctx.onReset(); }
      }
    });

    root.appendChild(screen);
    refresh();
  }

  return { render: render };
})();
