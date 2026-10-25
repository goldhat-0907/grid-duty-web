# 《电网值班室》网页游戏设计文档 v2（Grid Duty Web · 沉浸式升级版）

- 文档版本：2.2
- 创建日期：2026-10-25（v1 同日，git 提交 `1eb6efb` 保留历史）
- 状态：v1 已获用户批准（技术栈/范围/视觉三大决策）；**v2 按用户指令依据新数据包升级**；**v2.2 按用户指令新增风能/虚拟电厂/微电网场景与"进局前设置"**："增加风能、虚拟电厂与微电网相关场景、知识、技能等，进一步丰富场景，此外游戏进入前可选择用户身份、设置关卡和难度以及对一的知识、技能辅助等。"
- 数据源：`电网值班室_levels.json`（`meta.version 0.1.0` → v2.2 扩展至 v0.2.0：新增 L9–L11、vpp 角色、3 项技能，见 §5.5；当前位于 `D:\grid-duty-web\stepx-ai\电网值班室_levels.json`，实现时嵌入为 `data/levels.js`）
- v2 核心变化：新结构（`meters + actions/effects`）、角色（bonus/blind）、技能（from_level 解锁）、三级提示系统（知识/技能/操作）、沉浸式值班体验、**操作动画与效果反馈（v2.1）**、**风能/虚拟电厂/微电网扩展与进局前设置（v2.2）**

---

## 1. 背景与目标

将《电网值班室》数据包实现为**体验式、场景式、沉浸式教学游戏**，面向电气工程与能源动力工程专业大学生、电网新入职员工。玩家在深夜值班室中以**指定角色第一人称**值班：从交接班巡检开始，历经母线电压、风场出力骤降、主变过载、数据中心负荷突增、光伏反送、储能调峰、**风电爬坡平滑、虚拟电厂聚合、微电网孤岛运行**，直至台风夜保供收官——"算电协同"一条主线贯穿，风能/虚拟电厂/微电网融入主线。**进局前先选择扮演身份、关卡、难度档与知识/技能辅助档（§5.5）**，新手保通关、老手走挑战。

游戏内通过**三级提示（知识提示/技能提示/操作提示）**与**值班手册（知识图鉴）**完成课程知识与技能的传导，用**角色盲区、指令回执延迟、限时、告警**等机制制造值班真实感。

### 成功标准

- 竖屏网页游戏，浏览器直接访问，无需服务器，手机竖屏优先、桌面兼容。
- 数据包 11 关全部可玩（v0.2.0：原 8 关 + 风能/虚拟电厂/微电网 L9–L11）；关卡数值（表计、动作、效果、目标、红线、奖励）全部来自 `data/levels.js`，不写死。
- 每关存在至少一组可行解，且可在 `duration` 秒内完成（测试自动断言）。
- 7 种角色各具 bonus/blind，随关卡推进解锁，产生可感知的游戏差异（沉浸）；进局前可选扮演身份。
- 11 项技能按 `from_level` 逐关解锁，`need_skill` 动作在首通前被门禁（先学后会的教学节奏）。
- 知识/技能/操作三级提示随时可查，但查看消耗值班时间（效率权衡）。
- 深色 SCADA 值班台高逼真度，纯矢量绘制，无位图。
- 教学性：每关结算后按角色视角生成复盘卡（含正确/错误操作原理、记忆口诀、知识卡）；拥有 `patrol_log` 后复盘自动标注遗漏项。
- 进局前设置可用：身份选择（已解锁角色）、关卡选择、难度档（新员/标准/专家）、辅助档（引导/平衡/挑战），持久化于 localStorage。

---

## 2. 技术选型与约束（已确认决策）

| 项目 | 决策 |
|---|---|
| 技术栈 | 原生 HTML/CSS/JS（ES Modules），纯静态，无构建步骤，零第三方运行依赖 |
| 托管 | GitHub Pages（`https://goldhat-0907.github.io/grid-duty-web/`） |
| 范围 | 新数据包 11 关全部实现（v0.2.0 = 原 8 关 + 风能/虚拟电厂/微电网 L9–L11），并实现"进局前设置"（身份/关卡/难度/辅助） |
| 数据源 | `电网值班室_levels.json`（v0.1.0 → v0.2.0，新增内容见 §5.5），嵌入 `data/levels.js`（ES 模块导出，file:// 与 https 均可用） |
| 参考原型 | `stepx-ai/wzki6i/`（StepX Studio 导出的构建版）作为行为参考，不参与运行时依赖 |
| 视觉 | 深色 SCADA 值班台，SVG + CSS 矢量绘制，禁止位图 |
| 本地目录 | `D:\grid-duty-web`（与威胁情报仓库隔离，独立 git 仓库） |
| 仓库名 | `grid-duty-web`，新建独立 GitHub 仓库 |

约束：GitHub Pages 仅托管静态文件 → 引擎全部在浏览器端运行；音效用 Web Audio API 合成（零资源文件）。

---

## 3. 系统架构与目录结构

```
grid-duty-web/
├── index.html                  # 单页入口
├── css/
│   ├── tokens.css              # SCADA 设计令牌：颜色/字体/间距/阴影/辉光
│   ├── layout.css              # 竖屏布局：top brief / middle 值班台 / bottom 动作台 / overlay
│   └── components.css          # 按钮/表计/滑杆/开关/告警条/弹层/角色名牌
├── js/
│   ├── main.js                 # 启动引导 + 玩法循环状态机（prepare→brief→operate→settle→review）
│   ├── state.js                # 进度/角色/技能/学分/知识卡/图鉴 + 身份/难度/辅助档设置（localStorage）+ 解锁逻辑
│   ├── data/
│   │   ├── levels.js           # 电网值班室_levels.json 内嵌（ES 模块，数据源，不改动）
│   │   └── enrichment.js       # 提示文本/知识卡全文/角色人设/模拟演化参数/操作提示序列
│   ├── engine/
│   │   ├── engine.js           # 通用表计引擎：meters 状态 + actions/effects + target/fail + cost/limit
│   │   └── sim.js              # 模拟演化：表计漂移/时段切换/事件序列（calc_sync 关卡）
│   ├── scoring.js              # 四维评分（安全/经济/绿色/效率）+ 星级 + 学分
│   ├── roles.js                # 7 角色：bonus/blind 挂接 + 人设数据
│   ├── skills.js               # 11 技能：from_level 解锁 / need_skill 门禁 / 效果挂接
│   ├── hints.js                # 三级提示系统：知识/技能/操作，分层 + 时间代价（按辅助档调整）
│   ├── fx.js                   # 反馈总线：Web Audio 合成音效 + 震动 + 动画触发器（§9.6）
│   ├── render/
│   │   ├── dashboard.js        # SCADA 值班台：表计/mimic/状态灯/告警横幅
│   │   ├── charts.js           # 趋势曲线/堆叠面积/SOC/24h 电价
│   │   └── persona.js          # 角色头像/岗位名牌/独白气泡/结算点评
│   └── ui/
│       ├── prepare.js          # 进局前设置：身份/关卡/难度/辅助 四步（§5.5/§11）
│       ├── brief.js            # 任务简报 + 角色开场（换班动画）
│       ├── controls.js         # 动作面板（按 actions 渲染，need_skill/blind 门禁 + 冷却显示）
│       ├── settle.js           # 结算卡（四维得分/星级/学分/知识卡）
│       ├── review.js           # 复盘卡（角色点评 + patrol_log 遗漏标注 + 答题）
│       ├── map.js              # 值班地图/关卡进度时间线
│       └── codex.js            # 值班手册：知识卡/角色/技能图鉴 + 三级提示入口
├── data/
│   └── 电网值班室_levels.json  # 原始数据副本（溯源用，运行时不被引用）
├── tests/
│   ├── engine.test.js          # 引擎纯 JS 断言测试（Node 可跑）
│   └── solutions.test.js       # 8 关可行解 + 红线覆盖 + 角色/技能门禁断言
└── README.md                   # 玩法说明 + 部署说明
```

模块边界原则：引擎与 UI 分离；引擎输入输出为普通对象（`{meters, tick, apply}`），便于 Node 测试。`enrichment.js` 是 v2 新增的"体验层"，承载提示与模拟参数，与数据层 `levels.js` 分开，避免污染数据源。

---

## 4. 玩法循环

数据包定义角色 + 关卡，循环为 `prepare → brief → operate → settle → review`：进局前设置 + 每关角色换班开场。

0. **prepare（进局前设置）**：主菜单 → 四步设置——① 身份（选已解锁角色，默认 `role_hint` 推荐并显示 bonus/blind）② 关卡（值班地图选已解锁关卡）③ 难度（新员/标准/专家，乘数见 §5.5）④ 辅助（引导/平衡/挑战，决定提示扣时与自动标注）。首通身份按 `role_hint` 锁定，重玩可自由换角；确认"上岗"进入 brief。
1. **brief（角色开场）**：角色头像/岗位名牌/开场独白 → 任务简报（`brief`）、目标（`target`）、红线（`fail` 提示为"红线警告"）、倒计时（`duration` 秒）、已解锁技能与角色 bonus/blind 提示。玩家确认"上岗"。
2. **operate（值班）**：中部 SCADA 值班台（表计/mimic）+ 底部动作台（`actions` 按钮）。每点击一次动作：
   - 检查门禁：`need_skill` 未解锁 → 拒绝 + 技能提示；`limit_by` 次数耗尽 → 拒绝；角色 blind 对应动作 → 拒绝（"无操作权"）。
   - 应用角色 bonus：duty 动作耗时 ×0.8；dispatch 出现 3 秒"调度回执"延迟后生效。
   - 应用 `effect` 到 meters，消耗 `cost` 秒；表计/告警/倒计时即时刷新。
   - 模拟演化（sim.js）按 tick 驱动表计漂移与事件。
   - 目标达成 → 可主动"交班结算"；红线触发或时间耗尽 → 强制结算/失败。
3. **settle（结算）**：按 `target`/`fail` 判定通关与否；按四维评分（§10）出分、星级、学分（`rewards.credit` + 星级加成）、知识卡（`rewards.card`）、技能奖励（`rewards.skills`）。
4. **review（复盘）**：按角色视角生成复盘卡：`did`（插值玩家真实操作）、`why`（原理）、`remember`（记忆口诀）、知识卡全文；拥有 `patrol_log` 时自动标注遗漏动作；三星评审要求回答一道知识点选择题。通关后解锁下一关与对应技能/角色。

### HUD

- 顶栏常驻：关卡名/角色名牌/倒计时/已用时间/实时四维得分。
- 中栏：SCADA 值班台（表计 + 状态灯 + 告警横幅）。
- 底栏：动作台 + "值班手册"（三级提示入口）。

---

## 5. 数据模型与通用引擎

### 5.1 数据模型（来自 `电网值班室_levels.json`）

```json
{
  "meta": { "title": "电网值班室：算电协同", "version": "0.1.0" },
  "roles": { "duty": { "name", "bonus", "blind", "desc" }, ... },
  "skills": { "patrol_log": { "name", "effect", "from_level" }, ... },
  "levels": [
    {
      "id", "name", "section", "role_hint", "duration", "difficulty",
      "brief",
      "meters": { "bus_voltage": 0.94, ... },        // 初始表计值
      "checks": ["bus_voltage", ...],                 // 交接班巡检：待核对项
      "target": "母线电压恢复到 0.97-1.03 并保持 20 秒",
      "fail":   { "voltage_out_gt": 3, "over_compensate": true },
      "actions": [ { "id", "name", "cost", "effect": {"bus_voltage": 0.015}, "limit_by", "need_skill" } ],
      "rewards": { "skills": ["switching"], "credit": 15, "card": "无功从哪来" }
    }
  ]
}
```

### 5.2 引擎规则 `engine.js`

- **状态**：`meters` 数值映射（浮点），引擎持有关卡副本，动作修改之。
- **动作**：`apply(actionId)` → 校验门禁 → 按 `effect` 做加法（如 `bus_voltage: 0.015`）→ 扣 `cost` 秒 → 记入操作日志（复盘 `did` 用）。`limit_by` 键名对应当关 meters 中的可用次数（如 `cap_banks: 4`，每投入一组 cap_in+1，达到上限拒绝）。
- **判定**：
  - `target` 达成条件由 enrichment 声明为可计算的判定函数（或结构化字段）：如"电压在 [0.97,1.03] 并保持 20s" → `bus_voltage ∈ [0.97,1.03]` 且连续满足 ≥20s；"频率维持 49.8-50.2Hz" → `freq ∈ [49.8,50.2]` 保持 `fail.hold_sec`。
  - `fail` 红线即时判定：越限次数（`*_gt` 类）、数值越界（`load_above`/`freq_below`/`profit_below`/`availability_below`）、布尔红线（`over_compensate`）。触发红线 → 立即失败结算（可重试）。
- **通用化**：引擎不感知具体关卡，只做"表计演化 + 动作生效 + 条件判定"，11 关共用一套代码；特例（交接班核对、时段电价、事件序列、风功率漂移）由 enrichment 声明。
- **难度/辅助档（进局前设置）**：关卡装载时按 §5.5 乘数调整 duration/drift/红线阈值/提示扣时/学分倍率；引擎本身不感知档位，判定逻辑不变。
- **角色修正**（§6）挂接在 apply 与判定层。
- **顺序执行与排队**（依据参考原型）：动作点击后进入执行队列，执行窗口内其他动作拒绝并提示"正在执行上一步操作"（busy）；dispatch 角色动作先入 pending 队列（"等待调度回执"，3s 后落地）；执行/回执窗口同时是动画与音效的演出时段（§9.6）。

### 5.3 模拟演化 `sim.js`

需要连续演化（`calc_sync: true` 或 enrichment 声明 drift）的关卡，按 100ms tick 演化：

- **表计漂移**：`freq` 下探（L3/L11 孤岛）、`t1_temp` 爬升（L4）、断面逼近（L5）、`availability` 衰减（L5/L7）、`wind_mw` 上下波动（L9）等，漂移率由 enrichment 按关声明。
- **时段切换**（L7）：24h 压缩至 `duration=150s`，电价分峰/平/谷三段，`period` 随进度切换；谷段充电/峰段放电触发 profit 结算。
- **事件序列**（L8/L11）：L8 三条故障按时间戳先后出现，每故障导致一路一级负荷失电，必须"先隔离再转供/恢复"，否则 `critical_out_sec` 计时；L11 孤岛运行约 60s 后触发"主网来电"事件，进入并网窗口。
- **事件提示**：事件发生时告警横幅 + 音效 + 角色独白气泡。

### 5.4 关卡玩法表（数据全部来自数据包 v0.2.0，行为由 enrichment 声明）

| # | 关卡 | 角色 | 时长 | 核心表计 | 目标 | 红线 | 核心动作 | 教学点 |
|---|---|---|---|---|---|---|---|---|
| 1 | 交接班巡检 | 值班员 | 120s | bus_voltage/oil_temp/dc_voltage/ups_ok/alarms/fire_ok | 六项读数逐一核对，漏检≤2、误判≤2 | missed>2 或 misjudge>2 | check(6s)/mark(4s) | 交接班六项必查、签字制度 |
| 2 | 母线电压偏低 | 值班员 | 90s | bus_voltage 0.94 | 恢复 0.97-1.03 并保持 20s | 越限>3 次或过度补偿 | cap_on(+0.015)/cap_off/tap_up(+0.01)/shed | 无功就地平衡、先补无功再动分接头 |
| 3 | 风电场出力骤降 | 场站运维 | 100s | freq 49.95（下探） | 频率 49.8-50.2 保持 10s | freq<49.5 | reserve_on(+0.08)/unit_up(+0.05)/interrupt/ess_discharge(需技能) | 一次调频与备用、并网证 |
| 4 | 主变过载转移 | 调度员 | 110s | t1_load 108/t2_load 62 | 1 号≤90 且 2 号不越限 | 油温>95 或 t2>100 | bus_couple(-12/+12)/reconfig(-18/+18)/cooling(温-6) | 转移路径、冷却压温、N-1 思维 |
| 5 | 数据中心负荷突增 | 调度员 | 90s | section_load 92/dc_served 60 | 断面≤100 且算力服务≥77MW | 断面>100 或可用率<0.5 | accept/defer/ess_support/dr_call(需技能)/degrade | 算电协同、可延迟负载、需量管理 |
| 6 | 光伏午间反送 | 场站运维 | 90s | end_voltage 1.08 | 末端电压回合格且弃光≤10% | 电压越限>2 次或弃光>20% | reactor_on(-0.03)/tap_down/inv_var(需技能)/curtail(+弃光8) | 光伏升压机理、吸收优先于弃光 |
| 7 | 储能调峰决策 | 储能站长 | 150s | soc 40/period 三段电价 | 日内收益>0 且数据中心可用率≥90% | profit<0 或可用率<0.9 | charge(soc+15,profit-6)/discharge(soc-15,profit+14)/hold/ancillary | 低充高放、SOC 双界、循环寿命 |
| 8 | 极端天气保供 | 调度员 | 180s | critical_served 3/3、secondary_lost 0、faults 3 | 一级负荷全保、二级损失≤30% | 关键负荷失电>60s 或二级损失>30% | isolate(faults-1)/transfer/blackstart/ess_genset(需技能)/ask_help | 先隔离再恢复、保供顺序、黑启动 |
| 9 | 风电爬坡平滑 | 场站运维 | 120s | wind_mw 138/plan_mw 150/soc 50 | 出力偏差 ≤±10 保持 15s | 偏差越限>3 或 SOC 越界>2 或弃风>15 | ess_charge/ess_discharge/plan_shift/curtail/forecast_fix(需技能) | 风功率预测、爬坡平滑、储能在风电中的作用 |
| 10 | 虚拟电厂聚合响应 | 虚拟电厂运营商 | 90s | gap 25/response 0/profit 0/四类资源池 | 聚合≥25 且满意度≥0.9 | 超时未达或满意度<0.7 | recruit_ev/hvac/ess/curt + bid_offer(需技能) | 虚拟电厂聚合、可调资源分类、组合竞价 |
| 11 | 微电网孤岛与并网 | 调度员 | 150s | freq 49.55/soc 45/island 1 | 孤岛稳定 30s 后同期并网 | 低频 49.2、未同期并网、SOC 越界 | ess_discharge/genset_on/load_shed/check_sync/reconnect(需技能) | 孤岛运行、下垂控制、同期并列条件 |

> 教学节奏：每个关卡奖励的技能（L1→patrol_log … L8→wave_analysis、L9→wind_forecast、L10→vpp_dispatch、L11→microgrid_ops）常作为**同关某个动作的 `need_skill` 门禁**，首通不可用、重玩可用——先学基础路径，再解锁进阶手段（例：L3 的储能放电顶峰需 L3 通关奖励的 `grid_tie`；L11 的同期并网需 L11 奖励的 `microgrid_ops`）。

---

### 5.5 数据包扩展 v0.2.0 与进局前设置（★ v2.2 核心）

**场景扩展**：原 8 关之上新增 L9–L11，融入"算电协同"主线（风能 / 虚拟电厂 / 微电网）。新增角色 1 个（`vpp`）、技能 3 项；实现时同步更新 `电网值班室_levels.json`（升版 v0.2.0）与 `data/levels.js`。

**新增角色 vpp（虚拟电厂运营商）**

```json
"vpp": {
  "name": "虚拟电厂运营商",
  "bonus": { "vpp_view": true, "action_speed": 0.8 },
  "blind": ["breaker_op"],
  "desc": "聚合分布式资源参与市场，看得见资源池、动不了开关"
}
```

**新增技能（from_level 9–11）**

| 技能 | 名称 | 效果 | from_level |
|---|---|---|---|
| wind_forecast | 风功率预测与平滑调度 | 复盘标注预测误差；解锁预测修正面板 | 9 |
| vpp_dispatch | 虚拟电厂调度权 | 解锁组合竞价与聚合优化提示 | 10 |
| microgrid_ops | 微电网并离网运行 | 解锁同期并网与孤网模式 | 11 |

**L9 风电爬坡平滑（场站运维 re_ops，120s，难度 3，calc_sync）**

```json
{
  "id": 9, "name": "风电爬坡平滑", "section": "发电（风电）", "role_hint": "re_ops",
  "duration": 120, "difficulty": 3, "calc_sync": true,
  "brief": "后半夜风速爬升又骤降，风场出力剧烈波动，并网点出力偏离计划 150MW，触发偏差考核。",
  "meters": { "plan_mw": 150, "wind_mw": 138, "soc": 50, "curtail": 0 },
  "target": "并网点出力与计划偏差 ≤ ±10MW 并保持 15 秒",
  "fail": { "deviation_out_gt": 3, "soc_out_gt": 2, "curtail_above": 15 },
  "actions": [
    { "id": "ess_charge",     "name": "储能充电消纳盈余", "cost": 6, "effect": { "wind_mw": -10, "soc": 10 } },
    { "id": "ess_discharge",  "name": "储能放电补缺",     "cost": 6, "effect": { "wind_mw": 10, "soc": -10 } },
    { "id": "plan_shift_up",  "name": "上调计划出力",     "cost": 9, "effect": { "plan_mw": 10 } },
    { "id": "plan_shift_down","name": "下调计划出力",     "cost": 9, "effect": { "plan_mw": -10 } },
    { "id": "forecast_fix",   "name": "超短期预测修正",   "cost": 7, "effect": { "plan_mw": 8 }, "need_skill": "wind_forecast" },
    { "id": "curtail",        "name": "有序限发",         "cost": 5, "effect": { "wind_mw": -12, "curtail": 6 } }
  ],
  "rewards": { "skills": ["wind_forecast"], "credit": 25, "card": "风电出力为什么难预测" }
}
```

> deviation 由引擎按 `wind_mw − plan_mw` 派生（展示用），动作只改 `wind_mw`/`plan_mw`。可行性：初值 dev=−12 → `ess_discharge`（+10）即入带；sim 令 `wind_mw` 约 ±3/10s 上下波动，用储能双向平滑维持带内。

**L10 虚拟电厂聚合响应（虚拟电厂运营商 vpp，90s，难度 4）**

```json
{
  "id": 10, "name": "虚拟电厂聚合响应", "section": "用电/市场", "role_hint": "vpp",
  "duration": 90, "difficulty": 4,
  "brief": "晚高峰电网出现 25MW 调峰缺口，聚合商召集分布式资源（充电桩/空调/储能/可中断负荷）在时限内凑齐并结算。",
  "meters": { "gap": 25, "response": 0, "profit": 0, "soc": 60, "availability": 1.0,
              "ev_pool": 3, "hvac_pool": 4, "ess_pool": 2, "curt_pool": 3 },
  "target": "聚合响应量 ≥25MW 且用户满意度 ≥0.9",
  "fail": { "window_out": true, "availability_below": 0.7 },
  "actions": [
    { "id": "recruit_ev",   "name": "调度充电桩集群停充", "cost": 8, "effect": { "response": 8, "profit": 6, "ev_pool": -1, "availability": 0.01 }, "limit_by": "ev_pool" },
    { "id": "recruit_hvac", "name": "楼宇空调温控",       "cost": 6, "effect": { "response": 5, "profit": 3, "hvac_pool": -1 }, "limit_by": "hvac_pool" },
    { "id": "recruit_ess",  "name": "分布式储能放电",     "cost": 7, "effect": { "response": 7, "profit": 4, "soc": -10, "ess_pool": -1 }, "limit_by": "ess_pool" },
    { "id": "recruit_curt", "name": "可中断负荷",         "cost": 5, "effect": { "response": 6, "profit": 2, "curt_pool": -1, "availability": -0.03 }, "limit_by": "curt_pool" },
    { "id": "bid_offer",    "name": "现货组合竞价",       "cost": 10, "effect": { "response": 3, "profit": 8 }, "need_skill": "vpp_dispatch" }
  ],
  "rewards": { "skills": ["vpp_dispatch"], "credit": 30, "card": "虚拟电厂是怎么'发'电的" }
}
```

> 可行性：如 `recruit_ev×2`（16）+ `recruit_ess×1`（7）+ `recruit_hvac×1`（5）= 28 ≥ 25，耗时 8+8+7+6=29s；满意度保 0.97（curt 最多 1 次），收益为正。`window_out` 表示时限内未达目标即失败。

**L11 微电网孤岛运行与同期并网（调度员 dispatch，150s，难度 4，calc_sync 事件序列）**

```json
{
  "id": 11, "name": "微电网孤岛与并网", "section": "配电/微电网", "role_hint": "dispatch",
  "duration": 150, "difficulty": 4, "calc_sync": true,
  "brief": "主网检修停电，园区微电网转孤岛运行，重要负荷由储能+柴发+光伏支撑；主网来电后需同期并网。",
  "meters": { "freq": 49.55, "voltage": 0.97, "soc": 45, "genset": 0, "island": 1, "load_served": 0.9, "sync_ok": 0 },
  "target": "孤岛稳定运行（freq 49.8–50.2 保持 30s、保供率 ≥0.85），主网来电后正确同期并网",
  "fail": { "freq_below": 49.2, "load_served_below": 0.7, "soc_out_gt": 2, "unsync_reconnect": true },
  "actions": [
    { "id": "ess_discharge", "name": "储能支撑频率", "cost": 6,  "effect": { "freq": 0.12, "soc": -8, "load_served": 0.05 } },
    { "id": "genset_on",     "name": "启动柴发",     "cost": 10, "effect": { "freq": 0.15, "voltage": 0.02, "genset": 1 }, "limit_by": "genset" },
    { "id": "load_shed",     "name": "切除次要负荷", "cost": 5,  "effect": { "freq": 0.10, "load_served": -0.08 } },
    { "id": "check_sync",    "name": "同期检查",     "cost": 8,  "effect": { "sync_ok": 1 }, "limit_by": "sync_ok" },
    { "id": "reconnect",     "name": "同期并网",     "cost": 12, "effect": { "island": 0, "load_served": 0.1 }, "limit_by": "island", "need_skill": "microgrid_ops" }
  ],
  "rewards": { "skills": ["microgrid_ops"], "credit": 35, "card": "为什么并列要'同期'" }
}
```

> 可行性：freq 49.55 → `genset_on`(+0.15) + `ess_discharge×2`(+0.24) ≈ 49.94；`reconnect` 前必须 `check_sync`（否则触发 `unsync_reconnect` 红线）；孤岛期 freq 约 0.02/10s 缓降，60s 后 sim 触发"主网来电"事件。

**难度档 difficulty_presets（进局前可选；装载时以乘数应用，不改数据包原值）**

| 档位 | 时长 | 漂移率 | 红线裕度 | 提示扣时 | 学分 |
|---|---|---|---|---|---|
| 新员 rookie | ×1.3 | ×0.6 | 越限次数 +1 / 阈值放宽 | ×0（免费） | ×0.8 |
| 标准 standard | 原值 | ×1.0 | 原值 | ×1.0 | ×1.0 |
| 专家 expert | ×0.85 | ×1.3 | 越限次数 −1 / 阈值收紧 | ×2 | ×1.2 |

**辅助档 assist_presets（进局前可选，决定知识/技能辅助强度）**

| 档位 | 提示扣时 | 操作提示 | 复盘标注 | 适用场景 |
|---|---|---|---|---|
| 引导 guided | 全部免费 | 完整序列 | 自动标注遗漏 | 新手/课堂演示（一对一教练全程在线） |
| 平衡 balanced（默认） | 知识免费，技能/操作按 §8 | 序列文字 | 按技能 patrol_log | 推荐 |
| 挑战 challenge | 全部按 §8（知识也扣 3s） | 仅设备高亮 | 无 | 老手/专家 |

规则：难度/辅助档在 `prepare` 选择并写入 localStorage；关卡装载时由 `state.js` 应用乘数（时长/漂移/红线阈值/提示扣时/学分倍率），`engine.js` 判定逻辑不变；结算卡显示本次"难度/辅助"档标签。

---

## 6. 角色系统（沉浸式角色扮演）

7 种角色全部来自数据包 `roles`（v0.2.0 新增 `vpp` 虚拟电厂运营商），各有 `bonus`（增益）与 `blind`（盲区）：

| 角色 | bonus | blind | 数据包描述 | 出演关卡 |
|---|---|---|---|---|
| 值班员 duty | 操作耗时 ×0.8 | 看不到全网潮流 | 站内值守，操作快 | L1、L2 |
| 调度员 dispatch | 决策有 3s 回执延迟 | 无 | 可下全网指令 | L4、L5、L8 |
| 继保工程师 relay | 可改定值/读录波 | 不操作一次设备 | 定值与录波 | 图鉴/重玩 |
| 检修工 maint | 可一键处理缺陷 | 无 | 需办工作票、耗时最长 | 图鉴/重玩 |
| 场站运维 re_ops | 可预判出力曲线 | 看不到全网潮流 | 快速调出力 | L3、L6 |
| 储能站长 ess | 精细 SOC 控制 | 不操作一次设备 | 充放与寿命 | L7 |
| 虚拟电厂运营商 vpp | 资源池全景 + 聚合操作 ×0.8 | 不操作一次设备（breaker_op） | 聚合响应快、看得见资源池 | L10 |

实现要点：
- **人设层**（enrichment）：每角色头像（SVG）、岗位名牌、开场独白、结算点评台词、专属表情包。
- **盲区物理化**：`grid_flow` 盲区 → 隐藏潮流/断面面板（"值班员视角：全网潮流不可见"）；`breaker_op` 盲区 → 隔离/合母联/转供等一次设备动作被禁用（"无操作权，请联系检修班"）。
- **增益生效**：duty 动作耗时 ×0.8；dispatch 每次动作进入 3s"调度回执"倒计时后效果才落地（可连续排队）；re_ops 显示出力预测曲线面板；ess 显示 SOC 精细刻度与双界告警。
- **解锁节奏**：L1 起为值班员；L3 解锁场站运维；L4 解锁调度员；L7 解锁储能站长；L10 解锁虚拟电厂运营商；relay/maint 通关 L4 后在图鉴解锁，供已通关关卡"自由重玩"选角。
- **进局前选角**：`prepare` 第一步身份选择从"已解锁角色"中挑选（首通锁定 `role_hint`，重玩自由换角），不同角色走不同手感（§5.5）。

---

## 7. 技能系统

11 项技能全部来自数据包 `skills`（v0.2.0 新增 3 项），按 `from_level` 逐关奖励解锁：

| 技能 | 名称 | 效果 | from_level |
|---|---|---|---|
| patrol_log | 巡检记录法 | 复盘自动标注遗漏项 | 1 |
| switching | 倒闸操作权 | 操作耗时减半 | 2 |
| grid_tie | 并网操作证 | 可执行新能源并网/解列（解锁 L3 储能放电顶峰等） | 3 |
| relay_set | 保护定值整定 | 可改定值并查看录波 | 4 |
| dr_auth | 需求响应协调权 | 可发起用户侧削峰（解锁 L5 dr_call） | 5 |
| inv_var | 逆变器无功协调 | 可调度逆变器无功（解锁 L6 inv_var） | 6 |
| ess_strategy | 储能调度策略 | 解锁峰谷最优解提示 + 保供储能协同 | 7 |
| wave_analysis | 故障录波分析 | 复盘显示完整因果链 | 8 |
| wind_forecast | 风功率预测与平滑调度 | 复盘标注预测误差；解锁预测修正面板 | 9 |
| vpp_dispatch | 虚拟电厂调度权 | 解锁组合竞价与聚合优化提示 | 10 |
| microgrid_ops | 微电网并离网运行 | 解锁同期并网与孤网模式 | 11 |

规则：
- 门禁：`need_skill` 动作在未持有对应技能时禁用，点击给出"技能提示"（预告解锁途径）。
- 效果：多数为"解锁动作"或"复盘增强"，不影响数值正确性（只扩展信息/能力，不给答案）。
- 技能提示：关卡内提示面板自动列出"本关可用技能 + 尚缺技能预告"。

---

## 8. 三级提示系统（知识 / 技能 / 操作）★ v2 核心

入口：底栏"值班手册"按钮 → 弹层三页签：**知识提示 / 技能提示 / 操作提示**。内容由 `enrichment.js` 逐关撰写。

| 层级 | 内容 | 时间代价 |
|---|---|---|
| 知识提示 | 该情景的工程原理 + 关联课程知识点 + 记忆口诀（如 L2："无功就地平衡——先补容性无功，再动分接头，避免长距离调压加重损耗"） | 3 秒 |
| 技能提示 | 本关可用技能及其挂接动作；未解锁技能做"预告"（"通关本关你将获得并网操作证，解锁储能放电顶峰"） | 3 秒 |
| 操作提示 | 分层递进：L1 提示动作类别（"优先使用电容投切"）→ L2 给出具体动作序列（"投入 2 组电容器即可回到 0.97"） | 5 秒 |

规则：
- 查看提示即扣对应值班时间（计入效率分）——**专家少看、新手保通关**，形成教学张力。
- 不提供即时"下一步高亮"；操作提示给出的是序列文字而非自动执行。
- 操作提示采用参考原型的**状态感知教练（guide()）**机制：按当前表计状态返回 `{text, deviceId}`，UI 高亮对应设备并显示提示气泡（如"电压偏低，先投电容器再动分接头"→ 高亮电容组）；时间代价规则不变，高亮不自动执行。
- 知识提示与 `rewards.card` 知识卡同源（卡标题 → 手册全文）。
- **辅助档（进局前设置）**：引导/平衡/挑战三档（§5.5）——引导档提示全免费、直给完整序列、复盘自动标注（一对一教练在线）；平衡档知识提示免费、技能/操作按表扣时；挑战档全部扣时、仅设备高亮。替代原"教学模式开关"。

---

## 9. 沉浸式体验设计

- **环境**：深色 SCADA 值班室；微噪声底噪（Web Audio 合成白噪声 + 低频电流嗡嗡声）；告警分 severity 蜂鸣（high 双短音 / critical 连续音）；操作"滴答"、指令回执"对讲机"声。
- **角色扮演**：每关"换班动画"（岗位名牌 + 头像 + 独白）→ 值班中角色专属气泡（事件吐槽/提醒）→ 结算角色点评（"交接班最忌漏项，这次多留了个心。"）。
- **值班日志**：8 关按"今夜值守时间线"串联（23:50 交接班 → … → 台风夜），地图页显示当前时刻与已过班次。
- **心跳感**：红线临近时红色边框低频脉冲 + 心跳音；倒计时最后 10s 变红加速。
- **触觉**：按 §9.6 门禁/红线反馈规则——操作被拒短震 `vibrate(20)`、红线临近长震 `vibrate(400)`（移动端）。
- **数值真实感**：表计采用等宽数字、指针微颤；动作成本秒级可见；事件气泡带来源设备名。

### 9.6 操作动画与效果反馈（依据参考原型 wzki6i 归纳）

**设备与拓扑动画**（SVG 矢量，CSS keyframes + 类名驱动）
- 设备 mimic 种类：`clock` 频率表 / `capacitor` 电容组 / `transformer` 主变 / `wind` 风场 / `turbine` 风机叶片 / `battery` 储能 / `dc` 数据中心 / `ups` / `alarm` 告警灯 / `fire` 消防 / `line` 线路 / `ev` 充电桩集群 / `hvac` 楼宇空调 / `resource` 聚合资源池（VPP）/ `genset` 柴发 / `sync` 同期表 / `island` 孤岛状态灯。每设备带 `status` 函数：`readout`（读数文案）/ `caption`（单位）/ `needle`（指针归一化映射）/ `level`（0~1 占比）/ `stateText`（状态文案）/ `alarm`（告警布尔）/ `live`（通流布尔）。
- 通流线路 `animate-line-flow`（0.62s：opacity 0.2→1、stroke-width 2 的流动感；虚线为备用/检修态）；由 `live` 条件控制亮灭（如储能 SOC>10 时放电线亮起）。
- 微电网与 VPP 状态可视化：`island` 孤岛态灯亮 + 联络线熄灭/变虚线；`sync` 同期表显示两侧压差/频差/角差（未达标前 `check_sync` 不可置位）；`reconnect` 成功后联络线重新 `line-flow` 点亮 + 并网冲击短音；VPP `resource` 池显示可用量角标与聚合进度条；风机叶片 `animate-spin-slow` 随出力快慢变速。
- 设备常态 `animate-device-pulse`（0.42s：SVG drop-shadow 辉光呼吸）；告警态 `animate-pulse`（2s：opacity 呼吸）；活动/关键事件状态点 `animate-ping`（波纹扩散）。
- 指针与数值补间：针表按 `needle` 映射驱动（如 freq → (freq−49.3)/1.1 归一化），数值表计用 tween 从旧值滚动到新值（requestAnimationFrame），杜绝跳变。

**表计渲染规格（range / good 带）**
- 每表计元数据：`label` / `unit` / `icon` / `range`（量程）/ `good`（健康区间，如 cap_in [0,4] 优 [0,4]、freq [49.3,50.4]）。
- 渲染：刻度带着色（good 内绿、超 range 红闪）、`readout` 数值补间、`stateText` 状态文案（"已投运/冷备用/服务达标/待承接"）、`level` 占比条。

**动作执行反馈链**
- 点击动作 → 按钮按压缩放 → 进入执行窗口（busy：其余按钮提示"正在执行上一步操作"）→ 效果落地瞬间：受影响表计 tween 滚动 + 对应设备 `device-pulse` 闪烁 + 通流线路 `line-flow` 亮/灭 + 操作滴答音。
- dispatch 角色：动作先进 pending 队列（"等待调度回执"倒计时），回执到达才落地效果与动画。

**门禁 / 红线反馈**
- 不可用动作：按钮置灰 + 点击给出 reason 文案（"尚未取得该操作的资格" / "等待调度回执" / "正在执行上一步操作" / "本局已结束"）+ 短震动 `vibrate(20)`。
- 红线临近（越限计数、低频减载计时、断面临界）：对应表计红色 flash 边框 + 长震动 `vibrate(400)` + 心跳音。
- 达标时刻：`stateText` 切换（"服务达标"）+ 达标色 + 正向弹跳动画。

**音效表（Web Audio 合成，零资源）**

| 事件 | 合成 |
|---|---|
| 操作落地 | 短正弦音（~0.22s，sine，gain ~0.06） |
| 告警 high | 双短音 |
| 告警 critical | 连续音 |
| 达标 | 上行和弦 |
| 调度回执 | 对讲机"滴" |
| 环境底噪 | 白噪声 + 低频电流嗡声（低增益循环） |

**计时 / 结算**
- 倒计时条随剩余时间缩窄；最后 10s 变红闪烁。
- 星级逐颗点亮 + 弹跳；学分滚动；结算/复盘卡 slide-up 入场。

---

## 10. 评分、星级与学分

沿用 v1 用户批准的四维框架，维度权重不变（安全 0.35 / 经济 0.25 / 绿色 0.20 / 效率 0.20），指标改为新数据包语义：

- **安全**：红线未触发（触发红线直接失败重试）；越限/违规次数 0；关键负荷未失电。
- **经济**：总操作耗时占比低；关卡特有经济指标（L7 净收益、L5 断面偏差、L6 弃光量、L4 冷却成本）。
- **绿色**：关卡绿色指标（L3 备用清洁调用、L6 弃光率、L5 绿电占比）；无绿色表计的关卡按"操作精准度"折算。
- **效率**：剩余时间比例 + 查看提示扣时。

星级：
- 一星：目标达成（通关）。
- 二星：通关 + 四维全部达标（红线零触发 + 耗时 ≤ 时限 90% + 绿色指标达标 + 效率 ≥ 基准线）。
- 三星：二星 + 复盘答题正确 + 提示总扣时 ≤ 阈值（鼓励独立完成）。

学分与奖励：通关发放 `rewards.credit`（10~40）+ 星级加成（+10/+20/+30）+ `rewards.card` 知识卡 + `rewards.skills` 技能。学分累计用于图鉴与角色解锁进度展示（纯展示，不设内购）。

---

## 11. UI / 视觉规格（深色 SCADA 值班台）

- **设计令牌**：沿用 v1 令牌——背景 #0B1220~#0E1A2B、面板 #131F33、边框 #1E2C45；语义 OK #2E9E5B / WARN #E2A93B / FAULT #D0473C / 信息蓝 #3B82F6 / 文本 #E6EDF7/#8CA3C0；辉光用 box-shadow + SVG drop-shadow；等宽数字 `tabular-nums`；`min_touch_px: 44`、brief 15px/label 13px/value 16px。
- **值班台（dashboard.js）**：按 meters 元数据（`label/unit/icon/range/good`）渲染表计——数字表、指针表（needle 映射）、电量条、状态灯；设备 mimic 图例：主变/电容组/储能方舱/风场/风机叶片/数据中心/线路/告警灯/消防/充电桩集群/楼宇空调/聚合资源池/柴发/同期表/孤岛状态灯，每设备带 `status` 函数（readout/level/stateText/alarm/live）；动画与反馈按 §9.6 规格执行。
- **进局前设置（prepare.js）**：主菜单（标题 + "今夜值守时间线" + 继续上次）+ 四步设置页——① 身份：已解锁角色卡片（头像/bonus/blind/出演关卡，标注 `role_hint` 推荐）② 关卡：值班地图关卡卡（星级/难度/时长/教学点/解锁态）③ 难度：新员/标准/专家（说明对时长/漂移/红线/学分的影响）④ 辅助：引导/平衡/挑战（说明提示扣时与自动标注）；确认"上岗"进入 brief。
- **告警横幅**：按 severity 着色滚入 + 闪烁；与事件序列联动。
- **动作台（controls.js）**：按 actions 渲染为按钮/拨杆；`cost` 秒显示；`need_skill` 锁定态（🔒+技能名）；`limit_by` 剩余次数角标；角色 blind 动作置灰 + "无操作权"提示。
- **图表（charts.js）**：趋势曲线（L3 频率、L4 负载、L5 断面）、24h 电价分段图（L7）、堆叠出力（L3）。
- **结算/复盘浮层**：四维得分条 + 星级逐颗点亮动画 + 学分滚动 + 知识卡翻转 + 角色点评气泡；复盘含 `did/why/remember` 插值 + patrol_log 遗漏标注 + 三星答题。

---

## 12. 进度与持久化

`localStorage`（键 `grid-duty-web.progress.v2`）：
- 关卡：最高星级、通关标记、最佳耗时、累计学分、已解锁技能、已收集知识卡。
- 角色：解锁状态（值班员默认；场站运维 L3；调度员 L4；储能站长 L7；继保/检修 L4 后）。
- 设置：进局前偏好（身份/难度档/辅助档）、音量、续玩进度。
- 图鉴：解锁过的技能/知识卡/角色汇总（值班手册）。
- "重置进度"按钮（清 localStorage）。

---

## 13. 测试与质量

- `tests/engine.test.js`：通用引擎断言——effect 叠加、cost/limit 记账、target/fail 判定、角色 bonus/blind 修正、技能门禁。
- `tests/solutions.test.js`：**11 关逐关自动化求解**——搜索动作组合空间，断言存在可行解且耗时 ≤ duration（对应数据包 `validator` 精神）；每关红线可被触发（负路径覆盖）；L1 漏检/误判计数正确；L9 偏差带、L10 资源池上限、L11 未同期并网红线覆盖。
- `sim.js` 演化测试：L3 频率下探曲线、L5 断面逼近、L7 时段切换、L8 事件序列时序、L9 风功率漂移、L11 孤岛频率衰减与"主网来电"事件。
- 难度/辅助档测试：难度乘数（新员/标准/专家）正确改变时长/漂移/红线阈值/学分；辅助档改变提示扣时与复盘标注行为。
- 手工走查：每关正常通关路径 + 故意违规路径（验证复盘卡与扣分、红线提示）；角色切换手感（duty 快、dispatch 延迟、盲区禁用）。
- 视口：手机竖屏（375×667 起）+ 桌面浏览器；触控目标 ≥44px。

---

## 14. 部署方案（GitHub Pages）

1. 在 `D:\grid-duty-web` 完成开发与测试（git 仓库已建，与威胁情报仓库隔离）。
2. 用 `gh` CLI 以账号 **goldhat-0907** 创建独立仓库 `grid-duty-web`。
3. `git push` main，开启 GitHub Pages（Source: main / root）。
4. 访问：`https://goldhat-0907.github.io/grid-duty-web/`。
5. **建仓库与推送为外部可见操作，执行前必须单独向用户确认。**

---

## 15. 验收标准

- [ ] 竖屏页面手机/桌面浏览器可直接访问并完成全部 11 关（含风能/虚拟电厂/微电网 L9–L11）。
- [ ] 所有关卡数值来自 `data/levels.js`（数据源 `电网值班室_levels.json` 副本），改 JSON 可影响关卡行为。
- [ ] 8 关各存在可行解且可在 `duration` 内完成（测试断言通过）。
- [ ] 7 角色 bonus/blind 生效；11 技能按 from_level 解锁、need_skill 门禁生效。
- [ ] 知识/技能/操作三级提示可查，且按 §8 规则扣时（随辅助档变化）。
- [ ] 进局前可完成身份/关卡/难度/辅助四步设置，难度与辅助档实际生效且设置持久化。
- [ ] 四维评分、星级、学分、复盘插值、知识卡、角色点评按规则工作。
- [ ] 深色 SCADA 值班台达标：发光状态灯、告警、表计群、mimic、纯矢量。
- [ ] 已部署至 `https://goldhat-0907.github.io/grid-duty-web/` 可公开访问。
