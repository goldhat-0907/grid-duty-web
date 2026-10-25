/* js/roles.js — 角色解锁节奏 + bonus/blind 文案 */
window.GDW = window.GDW || {};
window.GDW.roles = (function () {
  "use strict";
  var DATA = window.GDW.data;
  var ENR = window.GDW.enrichment;

  /* 角色解锁关卡：值班员默认，其余按对应关通关解锁（relay/maint 供已通关关卡重玩/图鉴） */
  var unlockAt = { duty: 1, re_ops: 3, dispatch: 4, relay: 4, maint: 4, ess: 7, vpp: 10 };

  function unlockedRoles(progress) {
    var cleared = (progress && progress.cleared) || {};
    var out = [];
    Object.keys(unlockAt).forEach(function (rk) {
      var need = unlockAt[rk];
      if (rk === "duty" || cleared[need]) out.push(rk);
    });
    return out;
  }

  function bonusText(roleKey) {
    var p = ENR.persona[roleKey];
    var r = DATA.PACK.roles[roleKey];
    var bits = [];
    if (r && r.bonus) {
      if (r.bonus.action_speed) bits.push("操作耗时 ×" + r.bonus.action_speed);
      if (r.bonus.confirm_delay) bits.push("决策回执 " + r.bonus.confirm_delay + "s");
      if (r.bonus.forecast) bits.push("可预判出力曲线");
      if (r.bonus.soc_control) bits.push("精细 SOC 控制");
      if (r.bonus.vpp_view) bits.push("资源池全景");
      if (r.bonus.defect_fix) bits.push("一键处理缺陷");
      if (r.bonus.can_set_value) bits.push("可改定值/读录波");
    }
    if (r && r.blind && r.blind.length) bits.push("盲区：" + r.blind.join("、"));
    return bits.join(" ｜ ");
  }

  function isBlinded(roleKey, opKind) {
    var r = DATA.PACK.roles[roleKey];
    return !!(r && r.blind && r.blind.indexOf("breaker_op") >= 0 && opKind === "breaker");
  }

  return { unlockedRoles: unlockedRoles, bonusText: bonusText, isBlinded: isBlinded, unlockAt: unlockAt };
})();
