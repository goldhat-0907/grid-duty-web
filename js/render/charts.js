/* js/render/charts.js — SVG 迷你趋势曲线 / 堆叠条（纯矢量） */
window.GDW = window.GDW || {};
window.GDW.charts = (function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  /* sparkline：series = 数值数组，meta = 表计元数据（画 good 带） */
  function spark(container, series, meta, w, h) {
    container.innerHTML = "";
    if (!series || series.length < 2) return;
    w = w || 140; h = h || 34;
    var range = meta ? meta.range : [0, 1];
    var lo = range[0], hi = range[1];
    var svg = el("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, "class": "spark" });

    if (meta && meta.good) {
      var yLo = h - (meta.good[0] - lo) / (hi - lo) * h;
      var yHi = h - (meta.good[1] - lo) / (hi - lo) * h;
      svg.appendChild(el("rect", { x: 0, y: yHi, width: w, height: Math.max(1, yLo - yHi), fill: "rgba(46,158,91,0.18)", rx: 2 }));
    }

    var pts = series.map(function (v, i) {
      var x = i / (series.length - 1) * (w - 4) + 2;
      var y = h - (v - lo) / (hi - lo) * (h - 4) - 2;
      return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }).join(" ");
    svg.appendChild(el("path", { d: pts, fill: "none", stroke: "#3B82F6", "stroke-width": 1.6, "stroke-linejoin": "round" }));
    container.appendChild(svg);
  }

  /* 堆叠条（L3 出力构成 / L10 聚合响应） */
  function stack(container, parts) {
    container.innerHTML = "";
    var total = parts.reduce(function (a, p) { return a + p.value; }, 0) || 1;
    var b = document.createElement("div");
    b.className = "stack";
    parts.forEach(function (p) {
      var seg = document.createElement("div");
      seg.className = "stack-seg";
      seg.style.width = (p.value / total * 100).toFixed(1) + "%";
      seg.style.background = p.color || "#3B82F6";
      seg.title = p.label;
      b.appendChild(seg);
    });
    container.appendChild(b);
  }

  return { spark: spark, stack: stack };
})();
