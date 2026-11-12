# DEV-PLAN · 小御宝 ImmuPal 原发性免疫缺陷病工作台

- 版本：v0.1.0-skeleton · 2026-11-12 夜间无人值守窗口
- 认领：Issue #74（xyb-openharness-dsh-plugins/.github）+ /claim 评论；私有仓 primary-immunodeficiency-workbench
- 运行模式：无人值守夜间（不提问、不停等，默认值落 DEV-REQUIREMENTS §五待晨审追认）
- 模型约束：仅使用免费 glm 系列（子代理只派 glm-3.5-flash）

## 一、病种与选择理由

原发性免疫缺陷病（PID）：一大类以反复/严重/罕见感染为主要表现的遗传性免疫缺陷，
《86 个罕见病病种诊疗指南（2025 年版）》收载（BACKLOG 标注目录 #66 · 页 385，原件未取得，M1 核数）。

选择理由（对照 BACKLOG 快照 2026-11-12-2310）：
1. 🔥 优先招募且 T1（R3 表内当时未认领的最高级别；核对 open issues 与 org 仓列表无认领、无建仓）；
2. 随访天然结构化：感染事件、IVIG 替代治疗按次、免疫球蛋白周期化验、预防性用药；
3. 与家族已有仓差异化明显：家族内免疫方向均为自身免疫（白塞/ANCA/PBC/AOSD）或过敏/补体，
   无免疫缺陷替代治疗线；CIDP 相似度最高但为神经脱髓鞘（输注结构可参照、语义完全不同）；
4. 姊妹避碰核查：behcet/achondroplasia/cidp/acquired-hemophilia 四仓 24h 内有 mtime，一律不碰。

## 二、参考基准（第 3 节第 2 步要求）

- 移植样板（客户端链路底本）：cervical-workbench（最近一个已过 V1 的同形非肿瘤仓，结构移植 + 语义逐项替换）
- 成熟对比基准：breast-cancer-workbench/prototypes/v0.4（首页 hero、五 Tab、分类眉题、卡片与最近报告表）
- 结构基准：aml-workbench/prototypes/v0.2 #mind/mind-burden（导航分组、生活影响线、事件泳道）
- 只抄结构与元素体系，不抄病种语义；禁词/残留 grep 断言进 check 链。

## 三、里程碑计划（M0–M9）

| 里程碑 | 计划 | 状态 |
| --- | --- | --- |
| M0 骨架 | 文档九件原创 + 接线三件（patch root / dsh config.root / 客户端真目录选择）+ 基线 check | 完成 2026-11-12 |
| M1 调研 | 医学 10 主题（指南核数）+ 用户研究（0 访谈如实）+ 家族结构对比 → DIFF-MATRIX 重名率实测 | 进行中 |
| M2 原型 | 四件套 + primer 三件套 + 两套演示档案 + 探针全量 + 独立评审 P0 清零 | 未开始 |
| M3–M9 | 按 22 号标准链 | 未开始 |

## 四、临床试验线处置（M0 实测，可推翻、待晨审追认）

**决定：试验线裁剪（真裁剪，无快照包、无 trialMatch 后端、前端不设假入口）。**

实测依据（非推断）：
- ClinicalTrials.gov API v2，`query.term="primary immunodeficiency"`（短语检索）countTotal：
  **601 条**（快照 2026-11-12 23:3x，pageSize=1 探测计数）。
- 601 条中绝大多数绑定单一亚型/基因缺陷（SCID、Wiskott-Aldrich、XLA、CGD 等特定入组标准）；
  此为产品判断（未逐条人工分层），如实标注：未做亚型分布统计。
- 裁剪理由（产品判断 + 实测量级）：PID 是数百亚型的家族性诊断，同一「工作台」无法为具体亚型
  逐例做四段匹配；用户主体处于 IVIG 维持期与感染监测期，试验线索不是第一优先信息线。
- 可推翻路径：若晨审判定保留，M4 用 unified-trial-mcp 实测四通道建快照，M2/M5 按 35 号补四段链路；
  裁剪期间「设置 · 临床数据库」tab 如实写「未接入，裁剪决定见 DEV-PLAN §四（601 条实测 2026-11-12）」。
- M4 实跑（L76，2026-11-13）：research/primary-immunodeficiency/ 四件套（manifest / trials-2026.jsonl /
  pid_trials_2026.sqlite / FAILED.md），样本 60 条；unified-trial-mcp 四通道夜间窗口 FAILED 未查（如实）。
  「裁剪+实测证据」合法分支已回流 starter rc.50（check-trial-chain 自测 4 例），
  临时 snapshot-* 命名已改回家族规范 trials-* 命名；cond 口径复核 733 条（2026-11-13）。

## 五、夜间窗口纪律

- 领取已在开工 30 分钟内落盘（本文件 + PROGRESS.md 首行 + issue #74）。
- 额度/鉴权/套餐类错误同一处最多重试 2 次；路径错（网络抖动）换路径重试不计入并记录：
  本夜 github.com git clone 两次超时 → 改「本地 init + 远端关联 + 仓库级代理」路径（已记录）。
- 时间盒 2026-11-13 08:00；到点完成当前原子步骤即收尾，写 MORNING-REVIEW.md。
