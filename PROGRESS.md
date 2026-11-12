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
