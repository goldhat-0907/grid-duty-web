/* js/skills.js — 技能：from_level 解锁 / need_skill 门禁辅助 */
window.GDW = window.GDW || {};
window.GDW.skills = (function () {
  "use strict";
  var DATA = window.GDW.data;

  /* 按进度返回已解锁技能键（from_level 对应关卡已通关） */
  function ownedSkills(progress) {
    var cleared = (progress && progress.cleared) || {};
    var out = [];
    Object.keys(DATA.PACK.skills).forEach(function (sk) {
      var sko = DATA.PACK.skills[sk];
      if (cleared[sko.from_level]) out.push(sk);
    });
    return out.sort(function (a, b) {
      return DATA.PACK.skills[a].from_level - DATA.PACK.skills[b].from_level;
    });
  }

  function byId(id) { return DATA.PACK.skills[id] || null; }

  /* 关卡奖励的技能（首通发放） */
  function rewardFor(levelId) {
    var lv = DATA.PACK.levels.find(function (l) { return l.id === levelId; });
    return lv && lv.rewards && lv.rewards.skills ? lv.rewards.skills[0] : null;
  }

  return { ownedSkills: ownedSkills, byId: byId, rewardFor: rewardFor };
})();
