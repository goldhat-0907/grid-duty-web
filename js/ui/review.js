/* js/ui/review.js — 复盘卡：did/why/remember 插值 + 三星答题 + 遗漏标注 */
window.GDW = window.GDW || {};
window.GDW.review = (function () {
  "use strict";
  var ENR = window.GDW.enrichment, DATA = window.GDW.data;

  function quizOptions(s) {
    var card = s.rewardCard;
    var titles = Object.keys(ENR.cards).filter(function (t) { return t !== card; });
    var a = titles[s.id % titles.length];
    var b = titles[(s.id + 3) % titles.length];
    var opts = [{ t: card, ok: true }, { t: a, ok: false }, { t: b, ok: false }];
    opts.sort(function () { return 0.5 - Math.random(); });
    return opts;
  }

  function render(root, ctx) {
    var s = ctx.s, progress = ctx.progress;
    root.innerHTML = "";
    var panel = document.createElement("div");
    panel.className = "review-panel";

    var head = document.createElement("div");
    head.className = "review-head";
    head.textContent = "复盘 · 以 " + ENR.persona[s.role].nameplate + " 的视角";
    panel.appendChild(head);

    var did = document.createElement("div");
    did.className = "rv-sec";
    var actionsDone = s.log.filter(function (l) { return !l.queued; }).map(function (l) { return l.name; });
    did.innerHTML = "<div class=\"rv-title\">本班操作记录</div><div class=\"rv-body\">" +
      (actionsDone.length ? actionsDone.join(" → ") : "（没有留下操作记录）") + "</div>";
    panel.appendChild(did);

    var why = document.createElement("div");
    why.className = "rv-sec";
    var card = s.rewardCard;
    why.innerHTML = '<div class="rv-title">原理 · ' + (card || "") + "</div><div class=\"rv-body\">" +
      (card ? ENR.cards[card] : "") + "</div>";
    panel.appendChild(why);

    var remember = document.createElement("div");
    remember.className = "rv-sec";
    var enr = ENR.levels[s.id];
    remember.innerHTML = '<div class="rv-title">记忆口诀</div><div class="rv-body">' +
      (enr.hints.know[0] || "") + "</div>";
    panel.appendChild(remember);

    var annotate = (progress && progress.ownedSkills && progress.ownedSkills.indexOf("patrol_log") >= 0) || s.autoAnnotate;
    if (annotate) {
      var allIds = s.actions.map(function (a) { return a.id; });
      var doneIds = s.log.map(function (l) { return l.action; });
      var missed = allIds.filter(function (x) { return doneIds.indexOf(x) < 0; });
      var note = document.createElement("div");
      note.className = "rv-sec annotate";
      note.innerHTML = '<div class="rv-title">遗漏标注（巡检记录法/引导模式）</div><div class="rv-body">' +
        (missed.length ? "以下操作本班未执行：" + missed.map(function (m) { return DATA.PACK.levels[s.id].actions.find(function (a) { return a.id === m; }).name; }).join("、") : "本班关键操作均已执行。") +
        "</div>";
      panel.appendChild(note);
    }

    if (s.achieved) {
      var quiz = document.createElement("div");
      quiz.className = "rv-sec quiz";
      quiz.innerHTML = '<div class="rv-title">三星答题 · 本关知识点是？</div>';
      var optRow = document.createElement("div");
      optRow.className = "quiz-row";
      quizOptions(s).forEach(function (o) {
        var b = document.createElement("button");
        b.className = "quiz-btn";
        b.textContent = o.t;
        b.addEventListener("click", function () {
          optRow.querySelectorAll(".quiz-btn").forEach(function (x) { x.disabled = true; });
          b.classList.add(o.ok ? "right" : "wrong");
          var msg = document.createElement("div");
          msg.className = "quiz-msg " + (o.ok ? "good" : "bad");
          msg.textContent = o.ok ? "回答正确，三星达成条件 +1" : "答错了，重看上方知识卡再试一次";
          quiz.appendChild(msg);
          ctx.onQuiz(o.ok);
        });
        optRow.appendChild(b);
      });
      quiz.appendChild(optRow);
      panel.appendChild(quiz);
    }

    var foot = document.createElement("div");
    foot.className = "review-foot";
    foot.innerHTML = '<button class="btn primary" data-act="menu">返回准备页</button>' +
      '<button class="btn ghost" data-act="retry">再值班一次</button>';
    foot.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      var act = btn ? btn.dataset.act : null;
      if (act === "menu") ctx.onDone();
      else if (act === "retry") ctx.onRetry();
    });
    panel.appendChild(foot);
    root.appendChild(panel);
  }

  return { render: render };
})();
