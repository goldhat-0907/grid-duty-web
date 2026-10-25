/* js/data/levels.js — 数据源：电网值班室_levels.json v0.2.0（8 关 + 风能/虚拟电厂/微电网 L9-L11） */
window.GDW = window.GDW || {};
window.GDW.data = (function () {
  "use strict";

  var PACK = {
    meta: { title: "电网值班室：算电协同", version: "0.2.0" },
    roles: {
      duty: {
        name: "值班员",
        bonus: { action_speed: 0.8 },
        blind: ["grid_flow"],
        desc: "站内值守，操作快，看不到全网潮流"
      },
      dispatch: {
        name: "调度员",
        bonus: { confirm_delay: 3 },
        blind: [],
        desc: "可下全网指令，但每次决策有回执延迟"
      },
      relay: {
        name: "继保工程师",
        bonus: { can_set_value: true, can_read_wave: true },
        blind: ["breaker_op"],
        desc: "能改定值、读录波，不参与一次设备操作"
      },
      maint: {
        name: "检修工",
        bonus: { defect_fix: true },
        blind: [],
        desc: "可处理设备缺陷，需办工作票，耗时最长"
      },
      re_ops: {
        name: "新能源场站运维",
        bonus: { forecast: true },
        blind: ["grid_flow"],
        desc: "可快速调出力、可预判出力曲线"
      },
      ess: {
        name: "储能站站长",
        bonus: { soc_control: true },
        blind: ["breaker_op"],
        desc: "可放电顶峰、充电填谷，电量与循环寿命有限"
      },
      vpp: {
        name: "虚拟电厂运营商",
        bonus: { vpp_view: true, action_speed: 0.8 },
        blind: ["breaker_op"],
        desc: "聚合分布式资源参与市场，看得见资源池、动不了开关"
      }
    },
    skills: {
      patrol_log: { name: "巡检记录法", effect: "复盘时自动标注遗漏项", from_level: 1 },
      switching: { name: "倒闸操作权", effect: "操作耗时减半", from_level: 2 },
      grid_tie: { name: "并网操作证", effect: "可执行新能源并网/解列", from_level: 3 },
      relay_set: { name: "保护定值整定", effect: "可改定值并查看录波", from_level: 4 },
      dr_auth: { name: "需求响应协调权", effect: "可发起用户侧削峰", from_level: 5 },
      inv_var: { name: "逆变器无功协调", effect: "可调度逆变器无功出力", from_level: 6 },
      ess_strategy: { name: "储能调度策略", effect: "解锁峰谷最优解提示", from_level: 7 },
      wave_analysis: { name: "故障录波分析", effect: "复盘显示完整因果链", from_level: 8 },
      wind_forecast: { name: "风功率预测与平滑调度", effect: "复盘标注预测误差；解锁预测修正面板", from_level: 9 },
      vpp_dispatch: { name: "虚拟电厂调度权", effect: "解锁组合竞价与聚合优化提示", from_level: 10 },
      microgrid_ops: { name: "微电网并离网运行", effect: "解锁同期并网与孤网模式", from_level: 11 }
    },
    levels: [
      {
        id: 1,
        name: "交接班巡检",
        section: "变电",
        role_hint: "duty",
        duration: 120,
        difficulty: 1,
        brief: "夜里 23:50 交接班，六项关键读数需要逐一确认后签字。",
        meters: { bus_voltage: 1.0, oil_temp: 62, dc_voltage: 220, ups_ok: 1, alarms: 2, fire_ok: 1 },
        checks: ["bus_voltage", "oil_temp", "dc_voltage", "ups_ok", "alarms", "fire_ok"],
        target: "确认全部六项读数，漏检不超过两项",
        fail: { missed_gt: 2, misjudge_gt: 2 },
        actions: [
          { id: "check", name: "核对该项读数", cost: 6 },
          { id: "mark", name: "标记异常", cost: 4 }
        ],
        rewards: { skills: ["patrol_log"], credit: 10, card: "交接班制度为什么要签字" }
      },
      {
        id: 2,
        name: "母线电压偏低",
        section: "变电/配电",
        role_hint: "duty",
        duration: 90,
        difficulty: 2,
        brief: "晚高峰，220kV 母线电压降到 0.94 倍额定，电容组尚未投运。",
        meters: { bus_voltage: 0.94, cap_banks: 4, cap_in: 0, tap: 0 },
        target: "母线电压恢复到 0.97-1.03 并保持 20 秒",
        fail: { voltage_out_gt: 3, over_compensate: true },
        actions: [
          { id: "cap_on", name: "投入一组电容器", cost: 5, effect: { bus_voltage: 0.015, cap_in: 1 }, limit_by: "cap_banks" },
          { id: "cap_off", name: "退出一组电容器", cost: 5, effect: { bus_voltage: -0.015, cap_in: -1 } },
          { id: "tap_up", name: "主变分接头升一档", cost: 8, effect: { bus_voltage: 0.01, tap: 1 } },
          { id: "shed", name: "限部分负荷", cost: 6, effect: { bus_voltage: 0.02, load_lost: 1 } }
        ],
        rewards: { skills: ["switching"], credit: 15, card: "无功从哪来" }
      },
      {
        id: 3,
        name: "风电场出力骤降",
        section: "发电",
        role_hint: "re_ops",
        duration: 100,
        difficulty: 3,
        brief: "凌晨风场出力由 180MW 在 8 分钟内跌到 40MW，系统频率开始下探。",
        meters: { freq: 49.95, wind_mw: 40, ess_mw: 0, soc: 55, spinning_reserve: 60 },
        target: "频率维持 49.8-50.2Hz",
        fail: { freq_below: 49.5, hold_sec: 10 },
        actions: [
          { id: "ess_discharge", name: "储能放电顶峰", cost: 6, effect: { freq: 0.06, ess_mw: 30, soc: -8 }, need_skill: "grid_tie" },
          { id: "reserve_on", name: "启动旋转备用", cost: 10, effect: { freq: 0.08, spinning_reserve: -20 } },
          { id: "unit_up", name: "其他机组增出力", cost: 12, effect: { freq: 0.05 } },
          { id: "interrupt", name: "启动可中断负荷", cost: 8, effect: { freq: 0.04, load_lost: 1 } }
        ],
        rewards: { skills: ["grid_tie"], credit: 20, card: "一次调频和二次调频差在哪" }
      },
      {
        id: 4,
        name: "主变过载转移",
        section: "变电",
        role_hint: "dispatch",
        duration: 110,
        difficulty: 3,
        brief: "1 号主变负载率冲到 108%，油温上升，2 号主变尚有裕度。",
        meters: { t1_load: 108, t2_load: 62, t1_temp: 78 },
        target: "1 号主变负载率降到 90% 以下且不造成 2 号过载",
        fail: { temp_above: 95, t2_over: 100 },
        actions: [
          { id: "bus_couple", name: "合母联转移负荷", cost: 9, effect: { t1_load: -12, t2_load: 12 } },
          { id: "reconfig", name: "调整运行方式", cost: 14, effect: { t1_load: -18, t2_load: 18 } },
          { id: "cooling", name: "启动备用冷却", cost: 7, effect: { t1_temp: -6 } }
        ],
        rewards: { skills: ["relay_set"], credit: 20, card: "变压器为什么怕热" }
      },
      {
        id: 5,
        name: "数据中心负荷突增",
        section: "用电/调度",
        role_hint: "dispatch",
        duration: 90,
        difficulty: 4,
        calc_sync: true,
        brief: "本地算力中心接到大批训练任务，申请负荷由 60MW 增至 110MW，区域电网已接近断面限额。",
        meters: { section_load: 92, section_limit: 100, dc_demand: 110, dc_served: 60, availability: 1.0 },
        target: "断面不越限，且算力服务量不低于申请量的 70%（≥77MW）",
        fail: { load_above: 100, availability_below: 0.5 },
        actions: [
          { id: "accept_task", name: "承接实时训练任务", cost: 8, effect: { section_load: 15, dc_served: 15 } },
          { id: "defer_training", name: "延后非实时训练任务 10 分钟", cost: 8, effect: { section_load: -15, dc_served: -5 } },
          { id: "ess_support", name: "储能放电顶住断面", cost: 6, effect: { section_load: -12, soc: -10 } },
          { id: "dr_call", name: "启动需求响应削峰", cost: 10, effect: { section_load: -10, availability: 0.02 }, need_skill: "dr_auth" },
          { id: "degrade_realtime", name: "降级部分实时业务", cost: 5, effect: { dc_served: -10, availability: -0.15 } }
        ],
        rewards: { skills: ["dr_auth"], credit: 25, card: "数据中心的电去哪了" }
      },
      {
        id: 6,
        name: "光伏午间反送",
        section: "配电",
        role_hint: "re_ops",
        duration: 90,
        difficulty: 3,
        brief: "午间分布式光伏大发，配网末端电压越上限，出现功率反送。",
        meters: { end_voltage: 1.08, curtail: 0, pv_mw: 45 },
        target: "末端电压回到合格区间，弃光率不超过 10%",
        fail: { voltage_above_gt: 2, curtail_above: 20 },
        actions: [
          { id: "reactor_on", name: "投入并联电抗器", cost: 7, effect: { end_voltage: -0.03 } },
          { id: "tap_down", name: "配变分接头降档", cost: 8, effect: { end_voltage: -0.02 } },
          { id: "inv_var", name: "逆变器吸收无功", cost: 6, effect: { end_voltage: -0.025 }, need_skill: "inv_var" },
          { id: "curtail", name: "有序限发", cost: 5, effect: { end_voltage: -0.04, curtail: 8 } }
        ],
        rewards: { skills: ["inv_var"], credit: 20, card: "屋顶光伏为什么会把电压顶高" }
      },
      {
        id: 7,
        name: "储能调峰决策",
        section: "发电/用电",
        role_hint: "ess",
        duration: 150,
        difficulty: 4,
        calc_sync: true,
        brief: "一天 24 小时压缩成 150 秒，电价分峰平谷三段，SOC 初始 40%，同时要给数据中心保供。",
        meters: { soc: 40, profit: 0, availability: 1.0, period: "flat" },
        target: "日内收益为正且算力中心可用率不低于 90%",
        fail: { profit_below: 0, availability_below: 0.9 },
        actions: [
          { id: "charge", name: "谷段充电", cost: 6, effect: { soc: 15, profit: -6 } },
          { id: "discharge", name: "峰段放电", cost: 6, effect: { soc: -15, profit: 14 } },
          { id: "hold", name: "待机不动", cost: 4, effect: {} },
          { id: "ancillary", name: "参与调频辅助服务", cost: 8, effect: { soc: -6, profit: 5, availability: 0.01 } }
        ],
        rewards: { skills: ["ess_strategy"], credit: 30, card: "一块电池的两笔账" }
      },
      {
        id: 8,
        name: "极端天气保供",
        section: "调度",
        role_hint: "dispatch",
        duration: 180,
        difficulty: 5,
        brief: "台风过境，三条线路相继故障，重要负荷（医院、水厂、数据中心）需要保供。",
        meters: { critical_served: 3, critical_total: 3, secondary_lost: 0, faults: 3 },
        target: "保住全部一级负荷，二级负荷损失不超过 30%",
        fail: { critical_out_sec: 60, secondary_lost_above: 30 },
        actions: [
          { id: "isolate", name: "故障隔离", cost: 10, effect: { faults: -1 } },
          { id: "transfer", name: "转供", cost: 12, effect: { critical_served: 1 } },
          { id: "blackstart", name: "启动黑启动预案", cost: 18, effect: { critical_served: 1, secondary_lost: 5 } },
          { id: "ess_genset", name: "储能与柴发协同", cost: 9, effect: { critical_served: 1, soc: -12 }, need_skill: "ess_strategy" },
          { id: "ask_help", name: "请求上级支援", cost: 15, effect: { secondary_lost: -5 } }
        ],
        rewards: { skills: ["wave_analysis"], credit: 40, card: "保供顺序是怎么定的" }
      },
      {
        id: 9,
        name: "风电爬坡平滑",
        section: "发电（风电）",
        role_hint: "re_ops",
        duration: 120,
        difficulty: 3,
        calc_sync: true,
        brief: "后半夜风速爬升又骤降，风场出力剧烈波动，并网点出力偏离计划 150MW，触发偏差考核。",
        meters: { plan_mw: 150, wind_mw: 138, soc: 50, curtail: 0 },
        target: "并网点出力与计划偏差 ≤ ±10MW 并保持 15 秒",
        fail: { deviation_out_gt: 3, soc_out_gt: 2, curtail_above: 15 },
        actions: [
          { id: "ess_charge", name: "储能充电消纳盈余", cost: 6, effect: { wind_mw: -10, soc: 10 } },
          { id: "ess_discharge", name: "储能放电补缺", cost: 6, effect: { wind_mw: 10, soc: -10 } },
          { id: "plan_shift_up", name: "上调计划出力", cost: 9, effect: { plan_mw: 10 } },
          { id: "plan_shift_down", name: "下调计划出力", cost: 9, effect: { plan_mw: -10 } },
          { id: "forecast_fix", name: "超短期预测修正", cost: 7, effect: { plan_mw: 8 }, need_skill: "wind_forecast" },
          { id: "curtail", name: "有序限发", cost: 5, effect: { wind_mw: -12, curtail: 6 } }
        ],
        rewards: { skills: ["wind_forecast"], credit: 25, card: "风电出力为什么难预测" }
      },
      {
        id: 10,
        name: "虚拟电厂聚合响应",
        section: "用电/市场",
        role_hint: "vpp",
        duration: 90,
        difficulty: 4,
        brief: "晚高峰电网出现 25MW 调峰缺口，聚合商召集分布式资源（充电桩/空调/储能/可中断负荷）在时限内凑齐并结算。",
        meters: { gap: 25, response: 0, profit: 0, soc: 60, availability: 1.0, ev_pool: 3, hvac_pool: 4, ess_pool: 2, curt_pool: 3 },
        target: "聚合响应量 ≥25MW 且用户满意度 ≥0.9",
        fail: { window_out: true, availability_below: 0.7 },
        actions: [
          { id: "recruit_ev", name: "调度充电桩集群停充", cost: 8, effect: { response: 8, profit: 6, ev_pool: -1, availability: 0.01 }, limit_by: "ev_pool" },
          { id: "recruit_hvac", name: "楼宇空调温控", cost: 6, effect: { response: 5, profit: 3, hvac_pool: -1 }, limit_by: "hvac_pool" },
          { id: "recruit_ess", name: "分布式储能放电", cost: 7, effect: { response: 7, profit: 4, soc: -10, ess_pool: -1 }, limit_by: "ess_pool" },
          { id: "recruit_curt", name: "可中断负荷", cost: 5, effect: { response: 6, profit: 2, curt_pool: -1, availability: -0.03 }, limit_by: "curt_pool" },
          { id: "bid_offer", name: "现货组合竞价", cost: 10, effect: { response: 3, profit: 8 }, need_skill: "vpp_dispatch" }
        ],
        rewards: { skills: ["vpp_dispatch"], credit: 30, card: "虚拟电厂是怎么'发'电的" }
      },
      {
        id: 11,
        name: "微电网孤岛与并网",
        section: "配电/微电网",
        role_hint: "dispatch",
        duration: 150,
        difficulty: 4,
        calc_sync: true,
        brief: "主网检修停电，园区微电网转孤岛运行，重要负荷由储能+柴发+光伏支撑；主网来电后需同期并网。",
        meters: { freq: 49.55, voltage: 0.97, soc: 45, genset: 0, island: 1, load_served: 0.9, sync_ok: 0 },
        target: "孤岛稳定运行（freq 49.8–50.2 保持 30s、保供率 ≥0.85），主网来电后正确同期并网",
        fail: { freq_below: 49.2, load_served_below: 0.7, soc_out_gt: 2, unsync_reconnect: true },
        actions: [
          { id: "ess_discharge", name: "储能支撑频率", cost: 6, effect: { freq: 0.12, soc: -8, load_served: 0.05 } },
          { id: "genset_on", name: "启动柴发", cost: 10, effect: { freq: 0.15, voltage: 0.02, genset: 1 }, limit_by: "genset" },
          { id: "load_shed", name: "切除次要负荷", cost: 5, effect: { freq: 0.10, load_served: -0.08 } },
          { id: "check_sync", name: "同期检查", cost: 8, effect: { sync_ok: 1 }, limit_by: "sync_ok" },
          { id: "reconnect", name: "同期并网", cost: 12, effect: { island: 0, load_served: 0.1 }, limit_by: "island", need_skill: "microgrid_ops" }
        ],
        rewards: { skills: ["microgrid_ops"], credit: 35, card: "为什么并列要'同期'" }
      }
    ]
  };

  return { PACK: PACK };
})();
