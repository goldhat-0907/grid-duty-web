/* js/scoring.js — 四维评分（安全0.35/经济0.25/绿色0.20/效率0.20）+ 星级 + 学分 */
window.GDW = window.GDW || {};
window.GDW.scoring = (function () {
  "use strict";
  var DATA = window.GDW.data, ENR = window.GDW.enrichment;
  var clamp = ENR.clamp;

  function levelGreen(s, m) {
    if (s.meters.curtail !== undefined) return clamp(1 - s.meters.curtail / (s.id === 9 ? 15 : 20), 0, 1);
    if (s.id === 5 || s.id === 7) return clamp(s.meters.availability !== undefined ? s.meters.availability : 1, 0, 1);
    return clamp(1 - m.mistakes * 0.12 + m.greenCalls * 0.05, 0, 1);
  }

  function hintThreshold(dur) { return Math.max(10, Math.round(dur * 0.06)); }

  /* s：引擎 state；settle：engine.settle 结果；quizCorrect：三星答题是否答对 */
  function compute(s, settle, quizCorrect) {
    var m = settle.metrics;
    var dur = Math.max(1, settle.duration);
    var timeRatio = m.timeUsed / dur;

    var safety = clamp(1 - 0.18 * m.bandBreaks - 0.08 * m.mistakes, 0, 1);
    var economy = clamp(1 - timeRatio * 0.55, 0, 1);
    var green = levelGreen(s, m);
    var efficiency = clamp(1 - m.hintCost / (dur * 0.08) - timeRatio * 0.25, 0, 1);
    var total = 0.35 * safety + 0.25 * economy + 0.20 * green + 0.20 * efficiency;

    var stars = 0;
    if (settle.achieved) {
      stars = 1;
      if (total >= 0.7 && m.bandBreaks === 0) {
        stars = 2;
        if (quizCorrect && m.hintCost <= hintThreshold(dur)) stars = 3;
      }
    }

    var level = DATA.PACK.levels.find(function (l) { return l.id === s.id; });
    var base = (level.rewards && level.rewards.credit) || 10;
    var credit = Math.round((base + (stars > 0 ? (stars - 1) * 10 : 0)) * (s.difficultyMult || 1));

    return {
      safety: safety, economy: economy, green: green, efficiency: efficiency, total: total,
      stars: stars, credit: credit, timeRatio: timeRatio, bandBreaks: m.bandBreaks,
      hintCost: m.hintCost, greenCalls: m.greenCalls, mistakes: m.mistakes
    };
  }

  return { compute: compute, hintThreshold: hintThreshold };
})();
