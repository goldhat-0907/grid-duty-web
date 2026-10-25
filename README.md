# 《电网值班室：算电协同》（Grid Duty Web）

面向电气工程 / 能源动力工程专业学生与电网新员工的**沉浸式值班教学网页游戏**。

- 技术栈：原生 HTML/CSS/JS，零依赖、零构建，纯静态。
- 托管：GitHub Pages → `https://goldhat-0907.github.io/grid-duty-web/`
- 数据源：`data/电网值班室_levels.json`（v0.2.0，11 关 / 7 角色 / 11 技能），运行时嵌入 `js/data/levels.js`。

## 玩法

```
准备页（身份 / 关卡 / 难度 / 辅助）→ 换班开场 → 值班操作 → 结算 → 复盘答题
```

- **11 关**：交接班巡检 → 母线电压 → 风场骤降 → 主变过载 → 数据中心负荷 → 光伏反送 → 储能调峰 → 极端天气保供 → **风电爬坡平滑 → 虚拟电厂聚合 → 微电网孤岛并网**。
- **7 种岗位**：值班员 / 调度员 / 继保工程师 / 检修工 / 新能源场站运维 / 储能站站长 / 虚拟电厂运营商，各有 bonus 与盲区。
- **三级提示**：知识提示（原理）、技能提示（本关技能）、操作提示（序列/设备高亮）；查看消耗值班时间，辅助档可调整（引导/平衡/挑战）。
- **四维评分**：安全 0.35 / 经济 0.25 / 绿色 0.20 / 效率 0.20，星级 1-3，学分累计。

## 本地运行

直接用浏览器打开 `index.html`（file:// 与静态服务器均可），或用任意静态服务器：

```
python -m http.server 8000
# 或 npx serve
```

## 测试

```
node tests/engine.test.js      # 引擎断言
node tests/solutions.test.js   # 11 关可行解 + BFS 自动求解 + 负路径
```

## 目录

```
index.html
css/            tokens / layout / components（深色 SCADA 设计令牌与动画）
js/
  data/         levels.js（数据源）· enrichment.js（体验层）
  engine/       engine.js（通用表计引擎）· sim.js（漂移/事件）
  scoring.js · roles.js · skills.js · hints.js · fx.js · state.js
  render/       dashboard · charts · persona
  ui/           prepare · brief · controls · settle · review · map · codex
  main.js       玩法循环状态机
data/           电网值班室_levels.json（源副本）
tests/          engine.test.js · solutions.test.js · harness.js
docs/           设计文档（v2.2）
```
