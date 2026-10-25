/* tests/harness.js — 用 vm 加载核心脚本（浏览器全局模拟），供 Node 断言 */
"use strict";
var vm = require("vm");
var fs = require("fs");
var path = require("path");
var ROOT = path.join(__dirname, "..");

var store = {};
var sandbox = {
  window: null,
  navigator: {},
  localStorage: {
    getItem: function (k) { return store[k] === undefined ? null : store[k]; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
  }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
var ctx = vm.createContext(sandbox);

var FILES = [
  "js/data/levels.js", "js/data/enrichment.js",
  "js/engine/engine.js", "js/engine/sim.js",
  "js/scoring.js", "js/roles.js", "js/skills.js", "js/hints.js", "js/state.js"
];

function loadAll() {
  FILES.forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  });
}
function GDW() { return sandbox.GDW; }

module.exports = { loadAll: loadAll, GDW: GDW, ROOT: ROOT };
