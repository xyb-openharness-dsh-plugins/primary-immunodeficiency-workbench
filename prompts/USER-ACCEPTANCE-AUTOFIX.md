# 用户验收问题自动检查与修复提示词（家族通用 · 可直接粘贴）

> **沉淀出处**：pericarditis-workbench 0.1.0–0.1.2 三轮用户实测（设置打不开 / 临床线缺失 / 指标卡丢失 / 指标体系过薄 / 3D 翻转失效 / 添加按钮缺失）。
> **参考实现仓**：`pericarditis-workbench`（探针 probe-<slug>-m2、migrate-public + ui-parity 双闸、trial-match 纯函数、primer 三件套接线（参考实现：pericarditis-workbench/prototypes/v0.2）、AUTOFIX 本尊）——新病种 M5 移植时优先从它抄，比从 breast/cervical 抄省一半调试。
> **适用时机**：M5 之后（此前没有 public/ 与探针，跑了是空转）；每轮用户验收反馈后、以及交付前各跑一遍。

> 用途：每轮用户验收反馈后、以及每个里程碑交付前，自动跑一遍「验收常见病」检查，命中即修复并回归。
> 出处：小包宝 0.1.0–0.1.2 三轮用户实测暴露的问题类（设置打不开 / 临床线缺失 / 指标卡丢失 / 指标体系过薄 / 3D 翻转失效 / 添加按钮缺失）。
> 用法：整段粘给开发 Agent；先检查后修复，禁止未复现就改，禁止修绿。

---

你是本工作台仓（prototypes/v0.2 + public + dsh 服务层）的验收问题巡检与修复 Agent。按下面 A–F 六类**逐类先检查、后修复**，每类给出：检查命令/探针、判定标准（三态：通过/失败/待人工）、修复动作、修复后的回归断言。任何「通过」必须带数字或 file:line，否则写「未测」。

## 0. 适用时机与适配（新病种仓必读）

- 本提示词在 **M5 完成后**生效（M5 前没有 public/ 与探针，跑了是空转）。M0–M5 期间按夜纲检查点清单执行。
- 本仓专用的探针/迁移文件在新病种仓不存在——**M5 移植时一并从 pericarditis-workbench 移植并按病种改写**：`scripts/probe-<slug>-m2.mjs`（36 条断言模板）、`scripts/migrate-public.mjs`（public 定点移植 + ui-parity 双闸）、`scripts/check-ui-parity.mjs`、`prototypes/vX.Y/trial-match.js`（35 号纯函数）、primer 三件套接线（参考实现：pericarditis-workbench/prototypes/v0.2）。这是 M5「七步移植」的一部分，不是可选项。
- 修复轮次硬上限 **2 轮**（与夜纲一致）：同一检查项修 2 轮仍红 → 停手写停修报告，不整夜空转。

## 开工三步（不做完不许改代码）

1. 跑基线：`npm run check`、`npm test`、`npm run audit`、`node scripts/probe-<slug>-m2.mjs`（病种全量探针；尚未移植的按 M5 移植节先落），失败数字照抄，只修相关子集，收尾全量复跑。
2. **在「宿主形态」复现用户问题**（`npm start -- --root <用户指定目录>` 后用无头浏览器点真实按钮）；`file://` 原型正常 ≠ 宿主正常——本轮「指标卡翻转无」「设置打不开」都是宿主形态才暴露的形态差。复现不出时：按最坏假设做防御性修复（双通道），并在报告里写「本地未复现，已按假设加固 + 需真机截图定位」。
3. 对照家族参考仓（只读）：设置/弹层/卡片交互看 `breast-cancer-workbench/prototypes/v0.4/`，试验线看 35 号文档与 `takayasu-workbench` 的 dsh 服务层。

## DP. 疾病概要（？号按钮——历史上最容易整条漏掉，每轮必查第一条）

- 检查：
  1. 顶栏存在可点的「?」（`[data-primer-open]`），aria-label 含「定义」与「趋势」；
  2. 首页状态卡有第二个入口；
  3. 点击后 `#disease-primer` 面板真实出现（primer.js 动态建 DOM——**index.html 里搜不到容器是正常的，搜不到 primer.js/primer.css/primer-data.js 三件才是缺失**）；
  4. 四段标题按序：定义→医学资料规范和指南情况→治疗全景→发展趋势；每段来源行；返回/✕ 双入口；Esc 退一层；
  5. **探针必须用 `--url` 指向本仓原型**（`node scripts/probe-disease-primer.mjs --url http://127.0.0.1:<port>/prototypes/v0.2/index.html`）——默认跑的是 starter examples 参考页，等于没查（家族真实发生过）。
- 修复：缺三件套 → 从 breast-cancer v0.4 或 pericarditis v0.2 拷 `primer.js`/`primer.css`（零耦合可直拷），`primer-data.js` 按本病种重写（window.DISEASE_PRIMER 字面量，四段 id 固定 definition/evidence/landscape/trend，来源行按「原件/官方入口/二次来源/nolink+note」四态）；index.html 按 demo-data→primer-data→primer→app 顺序加载；顶栏与首页各放一个 `data-primer-open` 入口。
- 回归：probe-disease-primer 10/10（本仓 URL）+ check-primer-links 全绿（--http 夜间可跳过并如实记 SKIP）。

## A. 设置与弹层（乳腺癌 CFG_TABS 形态）

- 检查：无头浏览器点顶栏「设置」→ 弹层打开且三 tab（工作区/文档解析 MinerU/临床数据库）可切；侧栏**没有**设置项（设置不占一级导航）。设置页若在侧栏且点击无响应，判失败。
- 修复：照 breast v0.4 `settingsModal(tab)` + `CFG_TABS` 模式改成弹层（工作区含资料目录口径「拒绝主目录/桌面/下载根/tmp」；MinerU 未勾选不上传 + 「勾选与保存不联网」如实标注；临床数据库 tab 与临床页同口径）。
- 回归：探针断言「弹层打开 + 三 tab 文案逐字 + MinerU 同意勾选存在」。

## B. 功能线完整性（对照 breast 一级菜单逐条点名，不许静默缺失）

- 检查：一级导航与 breast v0.4 并排列出；缺「临床」类菜单 = 失败；每个 (view,sub) 探针渲染非空（孤儿页 = 0）。
- 修复：缺哪条补哪条。试验/临床线必须按 **35 号四段链路**：建档（只有「已确认入库」字段参与匹配）→ 检索（按用户条件排，**无分数**）→ 匹配 → 收藏跟踪（只存本机，无假进度条）。
- 回归：探针逐路由 innerText > 20 字符计数。

## C. 试验匹配红线（35 号 E4–E7，命中即失败）

- 检查（静态 + 运行态各一遍）：
  1. 匹配卡有：分数方块 + 「登记字段符合度」小字 + **固定行「n / m 项对得上 · k 项待确认」**（只给百分数不给分母 = 失败）；
  2. 逐条证据链（✓/✕/? 三态，「记录里是：… · 条件要求：…」，✕ 与 ? 排前）；
  3. 候选池口径写在卡头（「已载 N / M 条…不是全库扫描」）；
  4. 「入排标准请到官方登记页核对」缺失声明在位；
  5. **禁词 0**：匹配指数 / 入选概率 / eligible / suitability（含否定句——检查器是子串匹配，文案改写绕开词面）；
  6. 匹配纯函数：可对照项 <2 不给百分数；**药物靶点不进分母**（函数签名不收靶点参数）；判据只来自快照真实字段。
- 修复：匹配计算抽成独立纯函数文件（如 `prototypes/vX.Y/trial-match.js`，node 可 `new Function` 加载断言；参考 pericarditis-workbench 同名文件）；百分数只在展示层算，不入库、不写判读列。
- 回归：探针断言上述 6 条 + 纯函数两例（相关=给分、不相关=硬性✕ 且诚实低分）。

## D. 指标卡与指标体系

- 检查：
  1. 看板有「最近值」指标卡位；指标检测页 3D 卡随数据自动成组（有数据才有卡）；
  2. 指标体系覆盖度：按病种随访规范应有的指标组（本台：炎症/血象/心肌标志物/用药安全监测/体征）逐组点名，缺组 = 失败——**「只有 2-3 个指标」是病种语义偷懒，不是极简**；
  3. 翻转：无头浏览器点击 → 等过渡完成（≥700ms）→ 断言 `aria-pressed=true` **且** `.flipped` class（双通道）**且** computed transform 含 matrix3d rotateY（-1 项）；只断言 aria 不算数；
  4. 翻转环境差防御：CSS 双选择器 `[aria-pressed="true"]` 与 `.flipped` 同时驱动；JS 侧 setAttribute + classList 同步。
- 修复：缺组补组（数据 + 指标元数据都进**演示唯一源** `prototypes/v0.2/demo-data.js`（metricDefs/metricGroups 下沉进数据文件），前端与服务端同源派生，服务端种子直读该文件（装包回退 public 同字节副本）——禁止手工双份镜像，parity 测试锁死）；翻转按 4 加固。
- 回归：探针翻转断言（先重置状态再点，防前序用例翻转污染造成假红/假绿——本轮真实踩到）。

## E. 录入窗口（F 系盘点）

- 检查：F2 清单逐页点名（发作、化验、用药/调药、感受笔记、资料登记、复诊问题、就医信息）——每页必须有：①头部「＋ 添加记录」主按钮（用户找不到入口 = 失败，表单藏在页尾不算入口）；②表单本体存在（`#form-*`）；③三态保存（保存并继续录入/保存并关闭/取消）；④字段 ≤6、数字键盘 inputmode；⑤空态有下一步按钮。
- 修复：缺表单补表单；addbar 置页首；「演示录入不持久化」如实标注。
- 回归：探针逐页断言「＋」存在 + 表单节点存在。

## F. 修复铁律（违反 = 本轮白做）

1. **不修绿**：不改断言迁就实现；探针失败先证明被测对象非空，再修实现。
2. **改包必升版**：patch-version → CHANGELOG 段 → `npm run build:version && npm run build:client` → `node scripts/migrate-public.mjs` 重生成 public（ui-parity 双闸必须绿；该脚本从 pericarditis-workbench 移植，白名单替换点按本仓改写）。
3. **演示唯一源**：数据改动只改 `prototypes/v0.2/demo-data.js`；服务端种子读该文件（装包回退 public 副本）；发现手工镜像数据立即重构掉。
4. **门禁全绿才算修完**：check / test / audit 全 exit 0，探针全套过；audit「待人工」项（如 CHANGELOG 缺版本号）当场清零。
5. **真机回归**：`npm pack --pack-destination release` → 按仓内 check-install.mjs 提示用**绝对路径** tgz 装入 DSH Desktop profile → bundles 登记 → 重启 → `verify-desktop-load.mjs` exit 0。dev-server 通过 ≠ 装机通过。**push 失败最多重试 2 次即放弃**（HTTP/1.1 降级再试一次），本地 commit 即视为里程碑完成——网络不阻塞主循环，晨审补推。
6. **汇报三态**：本地复现修复的写实测数字；本地未复现、按假设加固的写「未复现 + 加固 + 需真机验证」；没做的写未实现。禁止「大体完成」。
