# PROGRESS

- **病种**：原发性免疫缺陷病（PID，Primary Immunodeficiency Disease）
- **认领**：2026-11-12 23:10 夜间无人值守窗口；Issue #74（xyb-openharness-dsh-plugins/.github）+ /claim 评论 https://github.com/xyb-openharness-dsh-plugins/.github/issues/74#issuecomment-6827519883
- **仓**：xyb-openharness-dsh-plugins/primary-immunodeficiency-workbench（私有，空仓本地 init，远端关联待首次 push）
- **品牌**：小御宝 ImmuPal · slug `primary-immunodeficiency`
- **选择理由**：BACKLOG 🔥 优先招募；R3 表内 T1（优先级高于其余未认领 ⬜ T2）；随访天然结构化（感染事件/IVIG 按次/免疫球蛋白周期化验）；与家族已有仓差异化明显（免疫缺陷置换治疗线，无同质仓）；核对 open issues 与 org 仓列表确认无人在做（对照 24h 内 mtime 姊妹仓 behcet/achondroplasia/cidp/acquired-hemophilia 一律不碰）
- **当前里程碑**：M0 骨架（进行中）
- **下一步**：M0 文档九件 + 基线 check → M1 调研与 SPEC → M2 原型
- **阻塞**：无（github.com git clone 网络抖动已用「本地 init + 远端关联」路径绕过，推送待首次 commit 时实测）

## 2026-11-13 01:2x 进度（M5/M6 完成）

- M5（594ab11）：服务层七步移植完成（子代理执行 + 主线复核）。check 0✗、test 26/26（新增 bootstrap-parity 10 项 + api-base）；dev-server 双形态实测（bootstrap 2 档案、宿主前缀剥离、subjects POST is_demo=0、/tmp 拒绝）。版本 0.1.0→0.2.0。子代理两处超范围最小修复（check-ui-parity 漏 import、build-client 产物引号）已如实记录。
- M6：pack 0.2.0 tgz → check-install 四要素 → pnpm 装 Desktop profile（兄弟仓无损）→ bundles 75 登记 → 完整重启 → verify-desktop-load exit 0 → 装机库直查 20 表/播种真落库（subjects 2 / infections 11 / labs 14）。V2 自动签认（docs/signoffs/V2-装机-自动签认.md）；V3 UI 走查待人工。
- M7/M8 草稿已备（release notes + BACKLOG 状态行回填），冻结待晨审授权，不发布不推送 tag。
- 下一步：AUTOFIX A–F 验收巡检 → M9 回流（check-trial-chain 裁剪分支等 4 项）→ MORNING-REVIEW。

## 2026-11-13 01:4x 进度（AUTOFIX 巡检 + M9 回流完成）

- AUTOFIX A–F 巡检（USER-ACCEPTANCE-AUTOFIX.md，M5 后生效）：audit 40/44→**44/44**（check 链补字面 --test、README 疾病概要四段 ### 化、DEV-REQUIREMENTS-2026-11-13.md、.gitignore .secrets）；DP/设置/功能线/指标卡/录入窗五类此前已在 35/35 探针覆盖，本轮全量复跑全过（探针 10+13+35）。
- M9 回流（starter 240f03d，rc.50）：check-trial-chain「裁剪+实测证据」合法分支（自测 4 例）+ LESSONS L96–L98；本仓同步新检查器并改回家族规范 trials-* 命名，裁剪分支真实验证通过；starter 自检 236 文件 pass + test 67/67。
- M7/M8 草稿落盘 docs/release-draft/M7-M8-草稿.md（冻结待授权：tag v0.2.0 + release + BACKLOG 状态行 PR）。
- 各闸口：G1/G2 自动签认（待追认）· V1=check 0✗+test 26/26+audit 44/44 · V2 装机自动签认（装机库 20 表实证）· V3 UI 走查待人工。
- 停跑条件未触发；无未处理阻塞。

## 2026-11-13 01:3x 补充：宿主形态无头走查（AUTOFIX 开工三步第 2 步）

- scripts/probe-host-form.mjs（独立 dev-server :7821 + 无头 Chrome 点真实按钮）：**6/6 pass**——
  HOST1 bootstrap 混合数据源（档案来自本机库、AI 演示坞退场）、HOST2 设置弹层三 tab（MinerU「不联网」如实）、
  HOST3 ？四段 definition,evidence,landscape,trend、HOST4 A→B 切换（B 感染 8 条）、HOST5 390 无溢出、HOST6 无页面错误。
- 至此 AUTOFIX「宿主形态复现」一步从 curl 层升级为真实交互层；V3 仍待人工（Desktop 完整形态含原生 AI 面板）。

## 2026-11-13 06:0x M7/M8 执行（获用户「继续执行」授权）

- M7：tag v0.2.0 推送 + [release](https://github.com/xyb-openharness-dsh-plugins/primary-immunodeficiency-workbench/releases/tag/v0.2.0)（tgz + sha256 附件）。异常：首版 notes 混入杜撰功能词，发布后自查发现即更正并 API 校验（hasGarbled=false），发布物未受影响。
- M8：[PR #75](https://github.com/xyb-openharness-dsh-plugins/.github/pull/75)（BACKLOG R3 #66 状态列 → 🔵 v0.2.0，只改状态列，分支 backlog/pid-v0.2.0，合并待审）。
- 至此 M0–M9 全部执行完毕；剩余仅 V3 真机走查（两仓）待人工。
