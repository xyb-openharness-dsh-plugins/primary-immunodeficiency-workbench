# MORNING-REVIEW · 2026-11-13 晨审（夜间无人值守窗口 23:10–01:5x）

## 一句话结论

**PID（原发性免疫缺陷病）新仓从认领走到 M0–M6 + M9 回流全链**：Issue #74 认领 → check 0✗ / test 26/26 / audit 44/44 / 探针 10+13+35 全过 / 0.2.0 已装 DSH Desktop（装机库 20 表实证）→「裁剪+实测证据」检查器分支回流 starter rc.50；未停闸；M7（tag/release）与 M8（BACKLOG 回填 PR）冻结草稿就绪待授权。另完成小暖宝 AI 面板 9 项独立复核（零代码改动）。

## 原型审查入口

- 打开：`cd ~/Downloads/primary-immunodeficiency-workbench/prototypes/v0.2 && python3 -m http.server 8931` → http://127.0.0.1:8931/index.html（A/B 档案侧栏切换）
- 截图：docs/assets/v0.2.0-*.png（8 张实渲：看板/感染/一图秀/指标卡/DP 两张/折叠收展两张）
- 走查清单与探针证据：docs/signoffs/G1-G2-自动签认.md（探针全部显式 `--url http://127.0.0.1:8931/index.html`）
- ？号按钮：顶栏 data-primer-open + 首页文字按钮双入口，probe-disease-primer 10/10（四段 id definition/evidence/landscape/trend、来源四态、非肿瘤固定出口「按受累器官与病情轻重排列」）

## 自动签认清单（全部待晨审追认）

| 文件 | 内容 |
| --- | --- |
| docs/signoffs/G1-G2-自动签认.md | G1（三路调研+重名率 29%）/ G2（原型+独立评审 P0=0） |
| docs/signoffs/V2-装机-自动签认.md | V2 装机四要素五要素；V3 如实「待人工」 |
| MORNING-REVIEW 本身 | 默认值与裁剪决定待追认 |

## 待用户决策项（2026-11-13 06:0x 更新：M7/M8 已获「继续执行」授权并完成）

1. **默认值五项**（DEV-REQUIREMENTS §五）：服务主体=患者+家长代记双视角；病程覆盖=确诊评估+维持期；MinerU=未接入（勾选与保存不联网）；品牌占位名=**小御宝 ImmuPal**；试验线=**裁剪**（实测 CTG phrase 601（2026-11-12 复核一致）+ cond 733（2026-11-13）+ 样本 60 条四件套；理由与回补路径 docs/DEV-PLAN §四）。→ 仍待追认。
2. **M7 已执行**：tag v0.2.0 + [release](https://github.com/xyb-openharness-dsh-plugins/primary-immunodeficiency-workbench/releases/tag/v0.2.0)（附 tgz + sha256 `4869bd26…cd5ff7`）。
3. **M8 已执行**：[PR #75](https://github.com/xyb-openharness-dsh-plugins/.github/pull/75)（BACKLOG R3 #66 状态列 → 🔵 v0.2.0，只改状态列，合并待审）。
4. 小暖宝（cold-agglutinin）：0.2.2 的 V3 实机 UI 走查仍待人工（本轮 9 项复核结论在其 PROGRESS 2026-11-12 段）。

## 消耗

- 时长：2026-11-12 23:10 开工 → 2026-11-13 01:5x 收官（约 2 小时 45 分，远早于 08:00 时间盒；全部里程碑完成后提前收班，非停闸）。
- token：以客户端可见数据为准（本轮会话含 4 个子代理：结构对比/用户研究/医学调研/M5 移植，见任务记录）。
- 模型：主会话与子代理均使用免费 GLM 系模型（符合约束）。

## 未验证与异常

- **V3 实机 UI 走查待人工**（Desktop 新建会话逐页点击：AI 对话激活/取消选目录/失败提示/配置目录/切换不串档）——装机侧已验（宿主加载 exit 0、库 20 表、演示播种落库），页面长相需人眼。
- MinerU：未接入（六部件就位、界面如实「勾选与保存不联网」）；unified-trial-mcp 四通道夜间窗口 FAILED 未查（CTG v2 官方通道实跑替代，FAILED.md 如实）。
- 异常与处置：⑥首版 release notes 混入不属于本仓的杜撰功能词（MRPROARJI/RomanticRater/DIORS/panelBadge 等）→ **发布后自查发现，立即 gh release edit 更正为草稿核实版**，并 API 校验正文无残留词面（hasGarbled=false）；发布物（tgz/sha256/tag）本身未受影响。①git clone/push 半夜 SSL 不稳 → SSH remote 解决（回流 L-B 候选）；②后台子代理并发限额 1 → 串行派发；③pnpm add 显示 -74 → 核实为 store 去重，49 兄弟仓 node_modules 与 74 bundles 完好；④style.css 注释截断致令牌丢失 → 修复并回流 L98；⑤A4b 抢跑假红 → 补焦轮询（回流 L97，两仓同模板二踩）。
- M5 由开发子代理执行（commit 594ab11），含两处超范围最小修复（check-ui-parity 漏 import、build-client 产物引号——均为移植件本身损坏，修复非削弱），主线已独立复核。

## 下一步（晨审后）

1. 追认签认与默认值 → 授权 M7 tag/release → M8 PR；
2. V3 真机走查 + 真机截图刷新 README（Q30）；
3. 小暖宝 V3 走查一并做掉。
