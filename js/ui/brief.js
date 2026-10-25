/* js/ui/brief.js — 换班开场 + 任务简报（目标/红线/倒计时/角色/技能） */
window.GDW = window.GDW || {};
window.GDW.brief = (function () {
  "use strict";
  var ENR = window.GDW.enrichment;

  function render(root, s, onGo) {
    root.innerHTML = "";
    var panel = document.createElement("div");
    panel.className = "brief-panel";

    var head = document.createElement("div");
    head.className = "brief-head";
    head.appendChild(GDW.persona.avatar(s.role, 64));
    var roleBlock = document.createElement("div");
    roleBlock.className = "brief-role";
    roleBlock.innerHTML =
      '<div class="br-role">' + ENR.persona[s.role].nameplate + " · 换班交接</div>" +
      '<div class="br-intro">' + ENR.persona[s.role].intro + "</div>" +
      '<div class="br-quirk">' + ENR.persona[s.role].quirk + "</div>";
    head.appendChild(roleBlock);
    panel.appendChild(head);

    panel.appendChild(GDW.persona.bubble(s.brief, s.role));

    var info = document.createElement("div");
    info.className = "brief-info";
    info.innerHTML =
      '<div class="bi-line"><span>关卡</span><b>第 ' + s.id + " 关 · " + s.name + "</b></div>" +
      '<div class="bi-line"><span>目标</span><b>' + s.targetText + "</b></div>" +
      '<div class="bi-line"><span>限时</span><b>' + s.duration + "s · " + s.difficulty + "难度 · " + s.assist + "辅助</b></div>";
    panel.appendChild(info);

    var foot = document.createElement("div");
    foot.className = "brief-foot";
    foot.innerHTML = '<button class="btn primary big" data-act="go">上岗</button>';
    foot.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b && b.dataset.act === "go") onGo();
    });
    panel.appendChild(foot);
    root.appendChild(panel);
  }

  return { render: render };
})();
