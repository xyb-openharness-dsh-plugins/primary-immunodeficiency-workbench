# 批量补齐提示词：65 个仓的「目录 / 临床线 / 新建患者」三缺口（可直接粘贴给开发 Agent）

> 用途：一次性把全家族被同一组闸门拦下的仓逐个补到可交付。**不是重写工作台**——每个仓只补三处，其余不动。
> 出处：2026-11-12 全家族扫描 66 个目录，只有 1 个通过；两个新开发仓（acquired-hemophilia / cidp）同天在「目录弹窗」「临床线被推断裁掉」两处返工，随后又暴露第三类共性错误：只有 demo 档案、无新建入口。
> 参照实现：`cidp-workbench 0.2.1`（三闸门全绿、`POST /api/subjects` 实测 2→3 个档案）与 `acquired-hemophilia-workbench 0.3.0`（写入闭环）。
> 判据细则见 [PATIENT-DATA-AND-TRIALS-ONESHOT](PATIENT-DATA-AND-TRIALS-ONESHOT.md)；流程主体见 [FULL-CYCLE-KICKOFF](FULL-CYCLE-KICKOFF.md)。

---

## 整段复制 ↓

```text
你是小 X 宝家族工作台的批量补齐开发。目标：把被同一组闸门拦下的仓，逐个补到"用户能真实使用"，不是重做工作台。

每跑一个仓只做这三件事，不做第四件：
A 配置目录真入口   B 临床试验入口功能完整   C 新建患者 + 多档案 + 写进 sqlite
其余页面、文案、视觉、数据一律不动。动了要写进报告并给理由。

========== 0. 先跑队列，别凭记忆挑仓 ==========
在 starter 目录下逐个扫（这条命令生成今天的待办队列）：
  for d in ~/Downloads/*-workbench; do node <starter>/templates/check-patient-create.mjs "$d" >/dev/null 2>&1 || echo "TODO $d"; done
再把 check-data-dir / check-trial-chain 各扫一遍，三份结果合并去重 = 今日队列。
队列顺序（用户指定，不许改）：acquired-hemophilia → myeloma → thymic → lung-cancer → ovarian → breast，
其余按"改动面小的先做"（有 schema 的先做，无 schema 的后做），并在报告里给最终顺序与理由。

台账（必须建，跨会话可续）：<工作目录>/BACKFILL-LEDGER.md，一行一仓：
  仓 | 版本 | 原型分类 | A B C 各自状态 | 门禁 exit code | 装机版本 | 实机 | 阻塞原因
每做完一个仓立刻写一行，再开下一个。**不许一轮做完才补台账**。

========== 1. 开工先分类（决定施工单，决定 40 分钟还是 3 小时） ==========
对每个仓先判四件事，把结论写进台账：
  · 界面形态：public/ 独立前端（iframe）｜内联在 lib/client.js（无 public，体积过百 KB）
  · 数据层：有 schema/*.sql + dsh/store.js｜没有 schema（先要建库）
  · 档案表：有 subjects/profiles 表且带 is_demo｜没有（要加迁移）
  · 试验快照：research/<slug>/*trials*.sqlite 存在｜不存在

四个原型与施工单：
【A 型】有 public + 有 schema + 有 subjects 表          → 只差 UI 入口与路由（最快，1 小时内）
【B 型】有 public + 有 schema + 无 subjects 表          → 加一条只增迁移 + workbench 方法 + 路由 + UI
【C 型】有 public + 无 schema（无 sqlite 落库）          → 先补 store/迁移/schema，再接路由与 UI（最慢，别硬赶）
【D 型】无 public（界面内联在 lib/client.js）           → 施工照 A/B/C，但表单与列表写在 client.js 里；
                                                          注意 client.js 可能是生成物，真源看同目录 src/client.js 或构建脚本

========== 2. A 配置目录（四件，缺一件就是红） ==========
1 顶栏/设置里有「配置目录」入口，点击**真调**宿主选择器：bridge.uiWorkspace.pickDirectory()（拿不到才降级 showDirectoryPicker）。
2 口径硬拒：主目录本身 / 桌面 / 下载根目录 / tmp——客户端与服务端各判一遍（服务端不信任前端）。
3 落点接上：cordis.patch.yml 的 config.root: !!js dshHomePath('<slug>')；dsh/index.js 真读 config.root；
  选完回显当前目录；重开 Desktop 仍在（存 app_setting 一类设置表，别只放内存）。
4 「本原型为示意，目录未真实挂载」**只允许出现在宿主没有选择能力的降级路径**。
   如果仓里现在只有这句提示、没有任何选择动作——这就是本次要修的东西，不是可接受状态。
闸门：node <starter>/templates/check-data-dir.mjs <仓>

========== 3. B 临床试验（要么四段齐，要么裁得有实测） ==========
先看快照：
  · research/<slug>/ 有 sqlite + jsonl → 走四段齐全（默认选择，不许裁）
  · 确实没有、且通道也拿不到 → 才允许裁，但必须带实测证据（见下）

四段（35 号，缺一段就是假功能）：
1 建档：只有"已确认入库"的字段参与匹配；未核对候选不参与。
2 检索：关键词 + 病理/类型 + 状态 + 阶段 + 地区；按用户条件排，不掺分数；空态给"清空条件重试"。
3 匹配：pct = 符合项 ÷ 已对照项；**待确认按 0 计**（只偏低不偏高）；四档分层（字段都对得上/部分对得上/需补充信息/硬性条件不满足单列）；
   可对照项 < 2 **不给百分数**；逐条证据链三态 ✓/✕/?，✕ 与 ? 排前；pct 旁固定写"这不是入组资格，也不代表效果"。
4 呈现/收藏：saved_trial(record_id, saved_at) 落库；拒收零副作用且可恢复。
卡头必须写候选池口径：已载 N / 本次返回 M / 不是全库扫描 + 快照日期。
门槛：后端 trialMatch 返回总数用全表计数，不是过滤后条数；通道 FAILED 要逐来源透传，不许静默吞掉。

裁剪的唯一合法形态：manifest 里有逐通道终态（SUCCESS/NO_RESULTS/FAILED/TIMEOUT），
并写明「已载 X 条 · 相关 Y 条 · 相关 0 不代表没有研究（检索词命中才进池、通道召回有限）」；
禁止用「候选池会长期是个位数」「罕见病召回不可靠」这类推断当理由。
闸门：node <starter>/templates/check-trial-chain.mjs <仓>（有快照就必须对账：check-trial-snapshot.mjs 不许 --if-present）

========== 4. C 新建患者（demo 之外必须能建，落 sqlite） ==========
1 schema 只增不改：subjects(profile_key, name, meta, action_plan, is_demo, created_on) 已在就复用；
  没有就新增一条迁移（编号接着最大号，不许改历史文件）。
2 workbench 方法：createSubject/createProfile({name, meta}) → {profileKey}；profile_key 用 local-<时间戳>，
  不要拿姓名当键（同名不同人是两个人），不要与 demo 的键撞。
3 服务端路由：POST /api/<slug>/subjects（body ≤64KB，JSON 坏了返 400 可读错误）；
   建库失败要回滚，不许留半个档案。
4 UI：档案弹层加「＋ 新建我的档案」（表单：名称 / 一句说明），建完**立刻切到新档案并重拉 bootstrap**；
   多档案可列可切，会话与草稿按档案隔离；新档案从空记录开始也能用（不能白屏）。
5 demo 受保护：is_demo=1 的档案不可删、不被覆盖；删除只对自己建的生效（可写进测试）。
6 记录写入（症状/化验/治疗/问题/医院/报告/文档/感受 等八类）也要走 API + 落库，
   刷新后还在。只 push 内存数组 = 刷新即丢，用户第一句就是"不能建"。
闸门：node <starter>/templates/check-patient-create.mjs <仓>

========== 5. 每个仓的收尾（缺一项就不算完成） ==========
1 三条闸门 + 原有 npm run check / npm test / npm run audit 全跑，数字照抄（exit code 必写）。
2 版本号：VERSION / package.json / lib/version.js / 页面字面量四处同源；CHANGELOG 写清"补了什么、为什么"。
3 生成物：若 lib/client.js 或 public/ 是构建产物，**改真源再构建**（src/client.js、prototypes/vX.Y/app.js），
   直接改产物会被下一次 build 冲掉；ui-parity 双闸必须绿。
4 打包 + 装机：pnpm add <tgz> --config.strict-store-pkg-content-check=false；核对装机副本版本与 public/；
   登记 dsh.profile.bundles；**由用户自己退出重开 Desktop**，你不许重启正在运行的 Desktop。
5 提交：commit 一条说清三缺口各自修了什么；能推就推，推不上去写"本地已提交，push 待网络"。
6 台账写一行。

========== 6. 每个仓的报数（模板，缺项写"未实现"不是"通过"） ==========
仓 / 版本 / 原型分类(A/B/C/D)：
目录：入口 ✓ pickDirectory ✓ 拒绝 主目录·桌面·下载·tmp ✓ 落点 config.root ✓ 重开仍在 ✓
临床：快照 X 条 / 相关 Y 条 / 四段 [建档 ✓ 检索 ✓ 匹配 ✓ 收藏 ✓] / 探针 n/n / 或 裁剪+实测数字
患者：createSubject ✓ / 落库 is_demo=0 ✓ / 多档案切换 ✓ / demo 保护 ✓ / reload 持久化 ✓
门禁：data-dir exit=?  trial-chain exit=?  patient-create exit=?  check exit=?  audit=?/?
装机：tgz 版本=装机版本 ✓ / bundles ✓ / 实机三条（目录·临床·新建）待人工
异常：逐条写（哪个通道 FAILED、哪条探针 skip、为什么）

========== 7. 失败与放弃（不许"半成品算完"） ==========
· 同一处修 2 轮仍红 → 停手，写"停修报告"（卡在哪、证据、下一步），台账写 STUCK + 原因，开下一个仓。
· 仓缺必要前置（如 C 型无 schema 且本晚没时间）→ 只做 A 与 C 的 schema 设计，B 留空并写"未实现"，
  **不许拿"裁剪说明"冒充临床线**。
· 网络/额度类错误：同一处最多重试 2 次；“路径错”（端口、代理、机器人无回执）可换路径，不计入 2 次。
· 有另一个会话在改同一个仓时的症状：git status 突然干净、你的改动消失、同名迁移出现两个编号
  → 立刻停手，先 git log/git reflog 确认，再从装机副本回灌并重编号，台账写 PARALLEL-CONFLICT。

========== 不要做的事 ==========
不许重写工作台或换视觉；不许改演示数据的病种语义；不许改历史迁移（只增）；不许为了让测试绿去改断言；
不许把"没测"写成"通过"；不许把 demo 数据当真实记录；不许把私有仓链接写进交付说明（会 404）；
不许在没有授权的情况下发 Release / 建 PR。

========== 最后一个仓之后 ==========
重跑第 0 步的扫描命令，把「通过 X/总数」与剩余 TODO 清单贴出来；对比开工时的数字，差多少条要能对上台账。
```

---

## 队列里前几个仓的实测差异（写提示词时用来校准施工单）

| 仓 | 版本 | 界面形态 | schema | subjects 表 | 试验快照 | 施工单 |
| --- | --- | --- | --- | --- | --- | --- |
| acquired-hemophilia | 0.3.0 | public/ | 有 | **有**（写入闭环已做） | 有（205 条） | **A 型**：先跑三道闸门复核，若已过就只补台账，别重复改 |
| myeloma | 0.1.1-rc.5 | public/ | **无** | 无 | 有（2 份） | **C 型**：先建 store/迁移，再接路由与 UI |
| thymic | 0.2.1 | public/ | 有 | **无** | 有 | **B 型**：加一条只增迁移 + 方法 + 路由 + 档案弹层入口 |
| lung-cancer | 0.1.2-rc.24 | **内联 client.js** | 无 | 无 | 无 | **D+C 型**：界面内联，表单写进 client.js 真源；先建库 |
| ovarian | 0.1.55 | **内联 client.js** | 无 | 无 | 无 | **D+C 型**：同上 |
| breast | 0.13.6 | public/ | 有 | 无（表名不同，先查清） | 无 | **B 型**：先确认档案表叫什么，再决定加表还是复用 |

> 这张表只是**开工前的一次快照**，不是结论：每个仓动手前必须自己重跑三道闸门，以当时的 exit code 为准。

## 三条纪律（比任何判据都重要）

1. **一次只动三处**。批量补齐最容易失控的地方是"顺手把别的也改了"——那会让回归面从 3 处变成 30 处，65 个仓就永远做不完。
2. **台账先行**。跨会话、跨夜里，唯一可信的进度来源是台账，不是记忆、也不是 commit 数。
3. **半成品要标出来**。宁可台账写 `B: STUCK（缺 schema，未实现）`，也不要写"临床线已按裁剪处理"——后者会被人当成做完了。