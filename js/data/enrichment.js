/* js/data/enrichment.js — 体验层：表计元数据/知识卡/人设/模拟参数/难度与辅助档/判定规则声明 */
window.GDW = window.GDW || {};
window.GDW.enrichment = (function () {
  "use strict";

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* 表计元数据：label 名称 / unit 单位 / icon 图标字 / range 量程 / good 健康区间 */
  var meters = {
    bus_voltage:  { label: "母线电压", unit: "p.u.", icon: "V", range: [0.88, 1.12], good: [0.97, 1.03] },
    oil_temp:     { label: "主变油温", unit: "℃", icon: "T", range: [40, 105], good: [40, 85] },
    dc_voltage:   { label: "直流电压", unit: "V", icon: "DC", range: [190, 240], good: [210, 230] },
    ups_ok:       { label: "UPS 状态", unit: "", icon: "UPS", range: [0, 1], good: [1, 1] },
    alarms:       { label: "告警条数", unit: "条", icon: "!", range: [0, 9], good: [0, 1] },
    fire_ok:      { label: "消防联动", unit: "", icon: "FIRE", range: [0, 1], good: [1, 1] },
    cap_banks:    { label: "电容组数", unit: "组", icon: "C", range: [0, 4], good: [0, 4] },
    cap_in:       { label: "已投电容", unit: "组", icon: "C", range: [0, 4], good: [0, 4] },
    tap:          { label: "分接头", unit: "档", icon: "TAP", range: [-3, 3], good: [-1, 1] },
    freq:         { label: "系统频率", unit: "Hz", icon: "Hz", range: [49.3, 50.4], good: [49.8, 50.2] },
    wind_mw:      { label: "风电出力", unit: "MW", icon: "W", range: [0, 200], good: [0, 200] },
    ess_mw:       { label: "储能出力", unit: "MW", icon: "E", range: [-60, 60], good: [-30, 30] },
    soc:          { label: "储能电量", unit: "%", icon: "SOC", range: [0, 100], good: [20, 90] },
    spinning_reserve: { label: "旋转备用", unit: "MW", icon: "R", range: [0, 120], good: [30, 120] },
    t1_load:      { label: "1#主变负载", unit: "%", icon: "TR", range: [0, 120], good: [0, 90] },
    t2_load:      { label: "2#主变负载", unit: "%", icon: "TR", range: [0, 120], good: [0, 100] },
    t1_temp:      { label: "1#油温", unit: "℃", icon: "T", range: [40, 105], good: [40, 85] },
    section_load: { label: "断面负载", unit: "MW", icon: "S", range: [0, 120], good: [0, 100] },
    section_limit:{ label: "断面限额", unit: "MW", icon: "L", range: [0, 120], good: [100, 120] },
    dc_demand:    { label: "算力申请", unit: "MW", icon: "DC", range: [0, 120], good: [0, 120] },
    dc_served:    { label: "算力服务", unit: "MW", icon: "DC", range: [0, 120], good: [60, 120] },
    availability: { label: "可用率", unit: "", icon: "OK", range: [0, 1], good: [0.9, 1] },
    end_voltage:  { label: "末端电压", unit: "p.u.", icon: "V", range: [0.88, 1.15], good: [0.97, 1.03] },
    curtail:      { label: "弃风弃光", unit: "%", icon: "S", range: [0, 30], good: [0, 10] },
    pv_mw:        { label: "光伏出力", unit: "MW", icon: "PV", range: [0, 80], good: [0, 80] },
    profit:       { label: "日内收益", unit: "万元", icon: "¥", range: [-20, 40], good: [0, 40] },
    period:       { label: "时段电价", unit: "元/kWh", icon: "P", range: [0, 2], good: [0, 2] },
    critical_served: { label: "一级负荷供电", unit: "路", icon: "K", range: [0, 3], good: [3, 3] },
    critical_total:  { label: "一级负荷总数", unit: "路", icon: "K", range: [3, 3], good: [3, 3] },
    secondary_lost:  { label: "二级损失", unit: "%", icon: "S", range: [0, 40], good: [0, 30] },
    faults:       { label: "待处理故障", unit: "起", icon: "!", range: [0, 3], good: [0, 0] },
    plan_mw:      { label: "计划出力", unit: "MW", icon: "P", range: [120, 180], good: [130, 170] },
    deviation:    { label: "出力偏差", unit: "MW", icon: "Δ", range: [-30, 30], good: [-10, 10] },
    gap:          { label: "调峰缺口", unit: "MW", icon: "G", range: [0, 40], good: [0, 25] },
    response:     { label: "聚合响应", unit: "MW", icon: "R", range: [0, 40], good: [25, 40] },
    ev_pool:      { label: "充电桩可用", unit: "组", icon: "EV", range: [0, 3], good: [0, 3] },
    hvac_pool:    { label: "空调可用", unit: "组", icon: "HVAC", range: [0, 4], good: [0, 4] },
    ess_pool:     { label: "储能可用", unit: "组", icon: "E", range: [0, 2], good: [0, 2] },
    curt_pool:    { label: "可中断可用", unit: "组", icon: "C", range: [0, 3], good: [0, 3] },
    genset:       { label: "柴发状态", unit: "", icon: "G", range: [0, 1], good: [0, 1] },
    island:       { label: "孤岛状态", unit: "", icon: "I", range: [0, 1], good: [0, 1] },
    load_served:  { label: "保供率", unit: "", icon: "S", range: [0, 1], good: [0.85, 1] },
    sync_ok:      { label: "同期检查", unit: "", icon: "SYNC", range: [0, 1], good: [1, 1] },
    voltage:      { label: "微网电压", unit: "p.u.", icon: "V", range: [0.9, 1.1], good: [0.97, 1.03] },
    load_lost:    { label: "损失负荷", unit: "MW", icon: "X", range: [0, 20], good: [0, 5] }
  };

  /* 角色人设：名牌 / 开场独白 / 结算点评 / 值班吐槽 */
  var persona = {
    duty:     { nameplate: "值班员", intro: "夜深了，把交接班的每一栏都核清楚再签字。", goodLine: "交接班最忌漏项，这次你留了个心。", badLine: "漏了一项，深夜最容易栽在细节上。", quirk: "手快，动作耗时可打八折。" },
    dispatch: { nameplate: "调度员", intro: "全网在我面前，每一道令都要给回执。", goodLine: "指令干脆，回执按时，调度台稳住了。", badLine: "调度要的是闭环，回执没落地等于没说。", quirk: "每道指令都有 3 秒回执延迟。" },
    relay:    { nameplate: "继保工程师", intro: "定值就是保护的眼睛，录波就是事故的证词。", goodLine: "定值整定到位，保护动作干净。", badLine: "一次设备我碰不得，该找检修班就得找。", quirk: "能改定值、读录波，不碰一次设备。" },
    maint:    { nameplate: "检修工", intro: "工作票办完才能动手，安全帽先戴好。", goodLine: "缺陷处理得快，票也齐，好样的。", badLine: "检修慢一步，全网都等你一个。", quirk: "可一键处理缺陷，但工作票耗时最长。" },
    re_ops:   { nameplate: "新能源场站运维", intro: "风场出力我摸得着脾气，预测曲线先亮出来。", goodLine: "出力调得又快又稳，电网兄弟省心了。", badLine: "只看站内、不看全网，视野要放宽。", quirk: "可预判出力曲线，但看不到全网潮流。" },
    ess:      { nameplate: "储能站站长", intro: "充一次、放一次，都是钱，也是责任。", goodLine: "低充高放玩得转，循环寿命也保住了。", badLine: "电池不是永动机，过充过放最伤它。", quirk: "SOC 看得细，但动不了一次设备。" },
    vpp:      { nameplate: "虚拟电厂运营商", intro: "看不见的发电厂——把分散的资源聚成一条力。", goodLine: "资源池调度得像一支队伍，缺口补上了。", badLine: "聚起来的是响应，散掉的是利润。", quirk: "看得见资源池、动不了开关。" }
  };

  /* 知识卡全文（与 rewards.card 对应） */
  var cards = {
    "交接班制度为什么要签字": "交接班是责任的转移：签字意味着'上一班交代的情况我已核对，出了问题我认账'。六项必查（母线电压/油温/直流/UPS/告警/消防）缺一不可，漏检会让隐患跨过零点。",
    "无功从哪来": "电压是靠无功功率支撑的。系统缺无功，电压就跌。电容器能就地发无功（超前），电抗器就地吃无功（滞后）。口诀：缺无功补电容，多无功加电抗，分接头只能微调、不能造无功。",
    "一次调频和二次调频差在哪": "一次调频靠发电机调速器自动响应，秒级、无人工；二次调频（AGC）由调度下发，分钟级、需通讯与回执。一次调频不花钱先救急，二次调频负责把频率精确拉回 50Hz。",
    "变压器为什么怕热": "变压器过载会让油温升高，绝缘纸每升温 8℃，寿命大致减半。过载时要转移负荷（合母联/调整方式）而不是硬扛，冷却系统只是给争取时间。口诀：先分流，再降温。",
    "数据中心的电去哪了": "算力中心最怕断电，但可延迟负载（训练任务）与实时业务不同：前者能等 10 分钟，后者一断就掉线。算电协同就是'把可等的负荷让开，把算力保在断面内'。",
    "屋顶光伏为什么会把电压顶高": "光伏大发时电流倒送，线路压降反向，末端电压被抬高。吸收过剩无功（电抗器/逆变器无功）是首选，弃光是最后手段。口诀：先吸收、再降压、最后才限发。",
    "一块电池的两笔账": "储能一边是现货套利（谷买峰卖），一边是辅助服务（调频更贵）。但 SOC 有双界：过充损坏、过放离网。低充高放赚钱，留两成电量兜底。",
    "保供顺序是怎么定的": "停电面前先保'性命攸关'：医院、水厂、数据中心是一级负荷。先隔离故障点，再逐路转供/黑启动恢复，二级负荷让位。排序靠的不是感情，是失电后果的严重度。",
    "风电出力为什么难预测": "风速随机起伏，风电出力天然波动，预测误差会带来偏差考核。储能是'平滑器'：出力高就充电消纳，出力低就放电补缺；预测修正则是把计划线往实测线上靠。",
    "虚拟电厂是怎么'发'电的": "虚拟电厂不发电，它聚合充电桩、空调、储能、可中断负荷，把'少用电'变成可出售的响应能力。响应速度与用户满意度是两本账：切得越多越伤体验，组合竞价找最优解。",
    "为什么并列要'同期'": "并网不是插头一插。两侧频率、电压、相位不一致时合闸，冲击电流可能烧设备。同期检查（压差/频差/角差都合格）后才能合闸——这是微电网从孤岛回到主网的第一步。"
  };

  var levels = {
    1: {
      mode: "handover",
      checks: {
        target: [{ t: "handover_min", checked: 4 }],
        fail: [{ t: "handover", missedGT: 2, misjudgeGT: 2 }]
      },
      hints: {
        know: ["交接班制度六项必查：母线电压、主变油温、直流电压、UPS、告警、消防。任何一项漏检都要在复盘里负责。"],
        skill: ["本关动作无需技能；通关获得『巡检记录法』，之后复盘会自动标注遗漏项。"],
        op: ["逐个点击设备核对读数，看到异常（油温偏高/告警未消）要标记。", "六项全部核对一遍，漏检不超过两项即可；标记异常前先看清读数。"],
        card: "交接班制度为什么要签字"
      },
      meta: { dev: "bus_voltage", actions: {} }
    },
    2: {
      mode: "standard",
      checks: {
        target: [{ t: "hold", meter: "bus_voltage", lo: 0.97, hi: 1.03, sec: 20 }],
        fail: [{ t: "out_of_band", meter: "bus_voltage", lo: 0.9, hi: 1.06, count: 3 }, { t: "above", meter: "bus_voltage", v: 1.05 }]
      },
      hints: {
        know: ["电压偏低是系统缺无功：先投电容（就地发无功），再动分接头，避免长距离调压加重损耗。"],
        skill: ["『倒闸操作权』通关后解锁：操作耗时减半；本关没有技能门禁动作。"],
        op: ["优先用电容器投切来抬升电压。", "投入 2 组电容器（约 +0.03）即可回到 0.97 并保持 20 秒。"],
        card: "无功从哪来"
      },
      meta: { dev: "cap",
        actions: { cap_on: { op: "breaker", dev: "cap" }, cap_off: { op: "breaker", dev: "cap" }, tap_up: { op: "breaker", dev: "tap" }, shed: { op: "breaker", dev: "shed" } } }
    },
    3: {
      mode: "standard",
      checks: {
        target: [{ t: "hold", meter: "freq", lo: 49.8, hi: 50.2, sec: 10 }],
        fail: [{ t: "below", meter: "freq", v: 49.5 }]
      },
      sim: { drift: function (s, dt) { if (s.meters.freq > 49.55) s.meters.freq -= 0.002 * dt; } },
      hints: {
        know: ["风电场出力骤降 → 系统有功缺额 → 频率下探。一次调频（旋转备用）秒级响应，储能放电是绿色应急。"],
        skill: ["『并网操作证』是本关通关奖励，也是本关『储能放电顶峰』的门禁：首通先学会备用/调机路径，重玩解锁储能。"],
        op: ["先启动旋转备用稳住频率，再考虑其他机组增出力。", "启动 1 次旋转备用（+0.08）再补 1 次机组增出力（+0.05）即可稳在 49.8 以上。"],
        card: "一次调频和二次调频差在哪"
      },
      meta: { dev: "freq", actions: { ess_discharge: { op: "field", dev: "bess" }, reserve_on: { op: "field", dev: "reserve" }, unit_up: { op: "field", dev: "gen" }, interrupt: { op: "field", dev: "load" } } }
    },
    4: {
      mode: "standard",
      checks: {
        target: [{ t: "lte", meter: "t1_load", v: 90 }, { t: "lte", meter: "t2_load", v: 100 }],
        fail: [{ t: "above", meter: "t1_temp", v: 95 }, { t: "above", meter: "t2_load", v: 100 }]
      },
      sim: { drift: function (s, dt) { s.meters.t1_temp += 0.1 * dt; s.meters.t1_load += 0.05 * dt; s.meters.t2_load -= 0.02 * dt; } },
      hints: {
        know: ["N-1 思维：一台主变过载，优先把负荷转移到有裕度的另一台（合母联/调整方式），冷却只是争取时间。"],
        skill: ["『保护定值整定』通关后解锁：可改定值并查看录波（重玩视角增强）。"],
        op: ["用转移类动作降 1# 负载，油温过高时开冷却。", "先『调整运行方式』（-18）或两次『合母联』（-24）把 1# 降到 90 以下，油温超 95 前开『冷却』。"],
        card: "变压器为什么怕热"
      },
      meta: { dev: "tr1", actions: { bus_couple: { op: "breaker", dev: "bus" }, reconfig: { op: "breaker", dev: "bus" }, cooling: { op: "field", dev: "tr1" } } }
    },
    5: {
      mode: "standard",
      checks: {
        target: [{ t: "gte", meter: "dc_served", v: 77 }],
        fail: [{ t: "above", meter: "section_load", v: 100 }, { t: "below", meter: "availability", v: 0.5 }]
      },
      sim: { drift: function (s, dt) { s.meters.section_load += 0.04 * dt; s.meters.availability -= 0.0005 * dt; } },
      hints: {
        know: ["算电协同：数据中心有实时/可延迟两类负载。可延迟任务让出断面，储能顶缺口，需求响应削峰。"],
        skill: ["『需求响应协调权』是本关奖励 + 本关『启动需求响应削峰』门禁：首通用储能/延后，重玩解锁 DR。"],
        op: ["先承接部分实时任务，再用储能/延后控制断面。", "承接 2 次实时任务（+30MW 服务）后，用 1-2 次储能放电顶住断面，dc_served ≥77 且断面不超 100。"],
        card: "数据中心的电去哪了"
      },
      meta: { dev: "dc", actions: { accept_task: { op: "field", dev: "dc" }, defer_training: { op: "field", dev: "load" }, ess_support: { op: "field", dev: "bess" }, dr_call: { op: "field", dev: "load" }, degrade_realtime: { op: "field", dev: "dc" } } }
    },
    6: {
      mode: "standard",
      checks: {
        target: [{ t: "hold", meter: "end_voltage", lo: 0.97, hi: 1.03, sec: 10 }],
        fail: [{ t: "out_of_band", meter: "end_voltage", lo: 0.9, hi: 1.05, count: 2 }, { t: "above", meter: "curtail", v: 20 }]
      },
      sim: { drift: function (s, dt) { s.meters.end_voltage += 0.0005 * dt; } },
      hints: {
        know: ["光伏反送抬高端电压：吸收过剩无功（电抗器/逆变器）优先，弃光是最后手段，弃光率有红线。"],
        skill: ["『逆变器无功协调』是本关奖励 + 本关『逆变器吸收无功』门禁：首通用电抗器/降档，重玩解锁逆变器。"],
        op: ["电压越上限：先投电抗器，再降配变分接头。", "投 1 次电抗器（-0.03）再降 1 档分接头（-0.02），末端电压回 1.03 以下；弃光勿超 20%。"],
        card: "屋顶光伏为什么会把电压顶高"
      },
      meta: { dev: "pv", actions: { reactor_on: { op: "field", dev: "reactor" }, tap_down: { op: "breaker", dev: "tap" }, inv_var: { op: "field", dev: "inv" }, curtail: { op: "field", dev: "pv" } } }
    },
    7: {
      mode: "standard",
      checks: {
        target: [{ t: "gte", meter: "profit", v: 0.01 }, { t: "gte", meter: "availability", v: 0.9 }],
        fail: [{ t: "end_below", meter: "profit", v: 0 }, { t: "below", meter: "availability", v: 0.9 }]
      },
      sim: { period: true },
      hints: {
        know: ["一日三段电价：谷段充电便宜、峰段放电赚钱。SOC 双界：过充伤电池、过放离网，留两成兜底。"],
        skill: ["『储能调度策略』通关后解锁：显示峰谷最优解提示 + 保供储能协同（L8 可用）。"],
        op: ["谷段充电、峰段放电，别在错误时段反着来。", "谷段（前 40s）充 2 次（+30 电量），峰段（40-110s）放 2 次（+28 收益），留 SOC≥20 保数据中心。"],
        card: "一块电池的两笔账"
      },
      meta: { dev: "bess", actions: { charge: { op: "field", dev: "bess" }, discharge: { op: "field", dev: "bess" }, hold: { op: "field", dev: "bess" }, ancillary: { op: "field", dev: "bess" } } }
    },
    8: {
      mode: "blackstart",
      checks: {
        target: [{ t: "eq", meter: "critical_served", v: 3 }, { t: "lte", meter: "secondary_lost", v: 30 }],
        fail: [{ t: "sec_out", meter: "critical_served", total: "critical_total", sec: 60 }, { t: "above", meter: "secondary_lost", v: 30 }]
      },
      sim: { events: [
        { at: 10, text: "台风刮断 1 号线路，医院一路失电！", fn: function (s) { if (s.meters.faults > 0) s.meters.critical_served -= 1; } },
        { at: 50, text: "2 号线路故障，水厂一路失电！", fn: function (s) { if (s.meters.faults > 0) s.meters.critical_served -= 1; } },
        { at: 90, text: "3 号线路跳闸，数据中心一路失电！", fn: function (s) { if (s.meters.faults > 0) s.meters.critical_served -= 1; } }
      ] },
      hints: {
        know: ["先隔离故障点（防扩大），再转供/黑启动恢复一级负荷；二级损失 ≤30%，关键失电 ≤60s。"],
        skill: ["『储能与柴发协同』需『储能调度策略』（L7 奖励）：首通用转供/黑启动，重玩可多用一路恢复手段。"],
        op: ["每条线路故障后：先『故障隔离』再『转供』。", "三路故障分别 隔离→转供；落后时用『储能与柴发协同』或『黑启动』抢时间，二级损失靠『请求上级支援』拉回。"],
        card: "保供顺序是怎么定的"
      },
      meta: { dev: "critical", actions: { isolate: { op: "breaker", dev: "line" }, transfer: { op: "breaker", dev: "line" }, blackstart: { op: "breaker", dev: "gen" }, ess_genset: { op: "field", dev: "bess" }, ask_help: { op: "dispatch", dev: "phone" } } }
    },
    9: {
      mode: "wind",
      checks: {
        target: [{ t: "hold_dev", meter: "wind_mw", ref: "plan_mw", lo: -10, hi: 10, sec: 15 }],
        fail: [{ t: "out_of_band", meter: "deviation", lo: -10, hi: 10, count: 3, derived: true }, { t: "out_of_band", meter: "soc", lo: 0, hi: 100, count: 2 }, { t: "above", meter: "curtail", v: 15 }]
      },
      sim: { windDrift: true },
      hints: {
        know: ["风电预测误差＝实际出力偏离计划。储能是平滑器：高了充电、低了放电；预测修正把计划线往实测线上靠。"],
        skill: ["『风功率预测与平滑调度』是本关奖励 + 本关『超短期预测修正』门禁：首通用储能/调计划，重玩解锁预测修正。"],
        op: ["偏差在带内靠储能充放；偏差大时先调计划再动手。", "初值偏低 12MW：储能放电 1 次（+10）入带，之后跟随漂移用充/放双向平滑，保持偏差 ≤±10。"],
        card: "风电出力为什么难预测"
      },
      meta: { dev: "turbine", actions: { ess_charge: { op: "field", dev: "bess" }, ess_discharge: { op: "field", dev: "bess" }, plan_shift_up: { op: "dispatch", dev: "plan" }, plan_shift_down: { op: "dispatch", dev: "plan" }, forecast_fix: { op: "dispatch", dev: "plan" }, curtail: { op: "field", dev: "turbine" } } }
    },
    10: {
      mode: "vpp",
      checks: {
        target: [{ t: "gte", meter: "response", v: 25 }, { t: "gte", meter: "availability", v: 0.9 }],
        fail: [{ t: "below", meter: "availability", v: 0.7 }]
      },
      hints: {
        know: ["虚拟电厂聚合充电桩/空调/储能/可中断负荷，把'少用电'卖成响应能力。可中断负荷最伤体验，慎用。"],
        skill: ["『虚拟电厂调度权』是本关奖励 + 本关『现货组合竞价』门禁：首通用四类资源凑数，重玩解锁竞价加成。"],
        op: ["缺口 25MW：先调用大户（充电桩/储能），空调温控作补充。", "充电桩×2（+16）+储能×1（+7）+空调×1（+5）=28MW，够 25；满意度保 0.9 以上（可中断最多 1 次）。"],
        card: "虚拟电厂是怎么'发'电的"
      },
      meta: { dev: "resource", actions: { recruit_ev: { op: "field", dev: "ev" }, recruit_hvac: { op: "field", dev: "hvac" }, recruit_ess: { op: "field", dev: "bess" }, recruit_curt: { op: "field", dev: "load" }, bid_offer: { op: "dispatch", dev: "resource" } } }
    },
    11: {
      mode: "microgrid",
      checks: {
        target: [{ t: "hold", meter: "freq", lo: 49.8, hi: 50.2, sec: 30 }, { t: "gte", meter: "load_served", v: 0.85 }, { t: "eq", meter: "island", v: 0 }],
        fail: [{ t: "below", meter: "freq", v: 49.2 }, { t: "below", meter: "load_served", v: 0.7 }, { t: "out_of_band", meter: "soc", lo: 0, hi: 100, count: 2 }, { t: "flag", flag: "unsync_reconnect" }]
      },
      sim: { islandDrift: true, mainBackAt: 60 },
      hints: {
        know: ["微电网孤岛运行靠储能/柴发撑频率电压；主网来电后必须『同期检查』（压差/频差/角差合格）才能并网，否则冲击电流烧设备。"],
        skill: ["『微电网并离网运行』是本关奖励 + 本关『同期并网』门禁：首通只能保孤岛，重玩解锁正式并网。"],
        op: ["孤岛期：启动柴发+储能撑频率；主网来电后先『同期检查』再『同期并网』。", "柴发（+0.15）+储能×2（+0.24）≈49.94Hz 保持 30s；来电事件后 check_sync → reconnect。"],
        card: "为什么并列要'同期'"
      },
      meta: { dev: "island", gate: { reconnect: "main_back" }, actions: { ess_discharge: { op: "field", dev: "bess" }, genset_on: { op: "field", dev: "genset" }, load_shed: { op: "breaker", dev: "load" }, check_sync: { op: "breaker", dev: "sync" }, reconnect: { op: "breaker", dev: "island" } } }
    }
  };

  var presets = {
    difficulty: {
      rookie:   { label: "新员", duration: 1.3, drift: 0.6, redlineSlack: 1, hintMult: 0, credit: 0.8, desc: "时长充裕、漂移平缓、红线放宽，提示免费，适合首次学习。" },
      standard: { label: "标准", duration: 1.0, drift: 1.0, redlineSlack: 0, hintMult: 1, credit: 1.0, desc: "数据包默认数值，推荐。" },
      expert:   { label: "专家", duration: 0.85, drift: 1.3, redlineSlack: -1, hintMult: 2, credit: 1.2, desc: "时长更紧、漂移更烈、红线收紧、提示翻倍扣时，学分加成。" }
    },
    assist: {
      guided:    { label: "引导", hintCost: { know: 0, skill: 0, op: 0 }, opDetail: "full", autoAnnotate: true, desc: "提示全免费、直给序列、复盘自动标注——一对一教练在线。" },
      balanced:  { label: "平衡", hintCost: { know: 0, skill: 3, op: 5 }, opDetail: "text", autoAnnotate: false, desc: "知识提示免费，技能/操作按 §8 扣时。" },
      challenge: { label: "挑战", hintCost: { know: 3, skill: 3, op: 5 }, opDetail: "highlight", autoAnnotate: false, desc: "全部提示扣时、仅设备高亮，考验独立值班。" }
    }
  };

  return { clamp: clamp, meters: meters, persona: persona, cards: cards, levels: levels, presets: presets };
})();
