/* js/render/persona.js — 角色头像/岗位名牌/独白气泡/结算点评 */
window.GDW = window.GDW || {};
window.GDW.persona = (function () {
  "use strict";
  var ENR = window.GDW.enrichment;

  /* 头像：圆形名牌 + 角色图标字 */
  function avatar(roleKey, size) {
    var p = ENR.persona[roleKey] || { nameplate: roleKey };
    size = size || 56;
    var d = document.createElement("div");
    d.className = "avatar";
    d.style.width = size + "px";
    d.style.height = size + "px";
    d.style.fontSize = Math.round(size * 0.34) + "px";
    d.textContent = (p.nameplate || "").charAt(0);
    d.title = p.nameplate;
    return d;
  }

  function nameplate(roleKey) {
    var p = ENR.persona[roleKey] || {};
    var span = document.createElement("span");
    span.className = "nameplate";
    span.textContent = p.nameplate || roleKey;
    return span;
  }

  /* 独白气泡 */
  function bubble(text, roleKey) {
    var b = document.createElement("div");
    b.className = "bubble";
    var label = roleKey ? nameplate(roleKey) : null;
    if (label) { var head = document.createElement("div"); head.className = "bubble-head"; head.appendChild(label); b.appendChild(head); }
    var body = document.createElement("div");
    body.className = "bubble-body";
    body.textContent = text || "";
    b.appendChild(body);
    return b;
  }

  /* 结算点评 */
  function verdict(roleKey, achieved) {
    var p = ENR.persona[roleKey] || {};
    return achieved ? (p.goodLine || "干得漂亮。") : (p.badLine || "再想想哪里出了问题。");
  }

  return { avatar: avatar, nameplate: nameplate, bubble: bubble, verdict: verdict };
})();
