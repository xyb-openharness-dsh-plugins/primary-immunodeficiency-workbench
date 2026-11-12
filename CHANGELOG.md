# 变更记录

只增不删；每条写清"改了什么 + 为什么 + 用户可见结果"。版本号与 VERSION、package.json 三处必须一致。

## 0.2.0 — 2026-11-13

- **首个可装版本**（M0–M6 夜间无人值守完成）：感染事件档案（部位/病原/抗感染用药/医生原话）、IVIG/SCIG 替代治疗按次记录、免疫球蛋白可比组化验档案、预防用药、接种口径（医生原话照录）、复诊准备；R3 家长代记双视角（author_role）。
- 原型 v0.2（结构移植 cidp-workbench + 病种语义重写）→ public/ 定点移植（ui-parity 双闸）→ 服务层七步移植（server/readmodels/demo/workbench/mineru/identity + src→lib 客户端链路）。
- 数据层：19 表冻结 schema（sha256 b87bccab…）；判读列 0；私密三出口；bootstrap 混合数据源（宿主形态读本机库、独立形态回退演示，禁裸 throw）。
- AI 面板：rc.46 会话激活契约（ownedSession/newSession/defaultWorkspace/取消与失败反馈/订阅重渲染/草稿只填不发）。
- 试验线裁剪：实测 ClinicalTrials.gov phrase=601（2026-11-12）/复核一致 + cond=733（2026-11-13）；unified-trial-mcp 四通道夜间窗口 FAILED 未查（如实）；依据与可推翻路径见 docs/DEV-PLAN §四。
- 未接入：MinerU 云解析（六部件就位，勾选与保存不联网）；V3 实机 UI 走查待人工。
- 用户可见结果：装进 DSH Desktop 后可新建档案、记录感染/替代治疗/化验、看可比组趋势与状态卡；所有数字由记录算出，解读归医生。

## 0.1.0 — 2026-11-12

- 由社区脚手架 dsh-wb-cli@1.10.0-rc.46 (9061c5c) 初始化，仅有注册骨架与健康接口，无业务功能。
