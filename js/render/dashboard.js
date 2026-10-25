/* js/render/dashboard.js — SCADA 值班台：表计卡片/告警横幅/教练气泡/数值补间/设备高亮 */
window.GDW = window.GDW || {};
window.GDW.dashboard = (function () {
  "use strict";
  var ENR = window.GDW.enrichment;
  var clamp = ENR.clamp;

  var DEV2METER = {
    cap: "cap_in", tap: "tap", freq: "freq", bess: "soc", reserve: "spinning_reserve",
    gen: "freq", load: "load_lost", bus: "t1_load", tr1: "t1_load", dc: "dc_served",
    pv: "pv_mw", reactor: "end_voltage", inv: "end_voltage", turbine: "wind_mw",
    plan: "plan_mw", ev: "ev_pool", hvac: "hvac_pool", resource: "response",
    genset: "genset", sync: "sync_ok", island: "island", line: "faults",
    critical: "critical_served", phone: "alarms", shed: "load_lost"
  };

  var node = null, cells = {}, bannerEl = null, coachEl = null, sparkEl = null, prev = {}, sparkTarget = null;

  function fmt(k, meta, v) {
    if (v === undefined || v === null || isNaN(v)) return "--";
    if (meta && (meta.unit === "%" || meta.icon === "SOC")) return Math.round(v);
    if (meta && meta.range && (meta.range[1] - meta.range[0]) > 50) return Math.round(v);
    if (meta && (meta.unit === "p.u." || meta.unit === "Hz" || meta.unit === "元/kWh")) return v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "") + "";
    return Math.round(v * 100) / 100 + "";
  }

  function render(s, root, onDevice) {
    node = root;
    node.innerHTML = "";
    prev = {};
    cells = {};
    bannerEl = document.createElement("div");
    bannerEl.className = "alarm-banner";
    node.appendChild(bannerEl);

    var grid = document.createElement("div");
    grid.className = "meter-grid";
    Object.keys(s.meters).forEach(function (k) {
      var meta = ENR.meters[k];
      if (!meta) return;
      var card = document.createElement("div");
      card.className = "meter-card";
      card.dataset.meter = k;
      card.innerHTML =
        '<div class="m-head"><span class="m-icon">' + meta.icon + '</span><span class="m-label">' + meta.label + "</span></div>" +
        '<div class="m-readout"><span class="m-val">--</span><span class="m-unit">' + meta.unit + "</span></div>" +
        '<div class="m-bar"><i></i></div>';
      grid.appendChild(card);
      card.addEventListener("click", function () { if (onDevice) onDevice(k); });
      cells[k] = card;
    });
    node.appendChild(grid);

    sparkEl = document.createElement("div");
    sparkEl.className = "spark-wrap";
    node.appendChild(sparkEl);

    coachEl = document.createElement("div");
    coachEl.className = "coach";
    node.appendChild(coachEl);

    update(s, true);
  }

  function barPct(k, meta, v) {
    var r = meta.range, lo = r[0], hi = r[1];
    return clamp((v - lo) / (hi - lo) * 100, 0, 100);
  }

  function tween(cell, k, meta, v) {
    var valEl = cell.querySelector(".m-val");
    var bar = cell.querySelector(".m-bar i");
    if (!valEl) return;
    if (!(k in prev)) prev[k] = v;
    var from = prev[k];
    var start = performance.now(), dur = 260;
    function step(now) {
      var t = clamp((now - start) / dur, 0, 1);
      var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      var cur = from + (v - from) * ease;
      valEl.textContent = fmt(k, meta, cur);
      bar.style.width = barPct(k, meta, cur).toFixed(1) + "%";
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    prev[k] = v;

    var inGood = meta.good && v >= meta.good[0] && v <= meta.good[1];
    var inRange = v >= meta.range[0] && v <= meta.range[1];
    cell.classList.toggle("bad", !inGood);
    cell.classList.toggle("danger", !inRange);
  }

  function update(s) {
    if (!node) return;
    if (!sparkTarget) {
      sparkTarget = Object.keys(s.meters).find(function (k) { return ENR.meters[k] && ENR.meters[k].good; }) || Object.keys(s.meters)[0];
    }
    Object.keys(s.meters).forEach(function (k) {
      var meta = ENR.meters[k];
      if (!meta || !cells[k]) return;
      tween(cells[k], k, meta, s.meters[k]);
    });
  }

  function spark(series, key) {
    if (!sparkEl) return;
    if (key) sparkTarget = key;
    GDW.charts.spark(sparkEl, series, ENR.meters[sparkTarget]);
  }

  function flash(deviceId) {
    if (!node) return;
    var meter = DEV2METER[deviceId];
    var card = (meter && cells[meter]) ? cells[meter] : null;
    if (!card && cells[deviceId]) card = cells[deviceId];
    if (!card) card = cells[sparkTarget] || null;
    if (card) {
      card.classList.remove("flash");
      void card.offsetWidth;
      card.classList.add("flash");
      setTimeout(function () { card.classList.remove("flash"); }, 800);
    }
  }

  function banner(text, sev) {
    if (!bannerEl) return;
    if (!text) { bannerEl.classList.remove("show"); bannerEl.textContent = ""; return; }
    bannerEl.textContent = text;
    bannerEl.className = "alarm-banner show sev-" + (sev || "high");
    if (sev === "critical") GDW.fx.alarm("critical");
    else GDW.fx.alarm("high");
    clearTimeout(bannerEl._t);
    bannerEl._t = setTimeout(function () { bannerEl.classList.remove("show"); }, 2600);
  }

  function coach(s) {
    if (!coachEl) return;
    var g = GDW.hints.guide(s);
    coachEl.innerHTML = '<span class="coach-ic">◉</span>' + (g.text || "");
    if (g.deviceId) flash(g.deviceId);
  }

  return { render: render, update: update, spark: spark, flash: flash, banner: banner, coach: coach, DEV2METER: DEV2METER };
})();
