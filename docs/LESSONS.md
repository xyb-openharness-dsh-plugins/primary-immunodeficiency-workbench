## 2026-10-25 · 从慢性淋巴细胞白血病小淋宝 LymPal（cll-workbench v0.2.0）回收

### L28 · 移植底本的检查器会把**底本病种名**当成本项目的期望值

`scripts/check-host-contract.mjs` 从「底本 + 布局」拼出的字符串里正则找 `customFrame`。
底本头部注释里写着「面板 customFrame=true · 业务 left 0.65」，而本项目的真实值是
`const CUSTOM_FRAME = String(PANEL.customFrame === true)`（生成物里的常量引用）。三轮修法都不对：

1. 先报 `true · 业务 left 0.65`（注释被当值）→ 只剥 `//`/`/*` 行头，**没剥块注释续行 ` * `**；
2. 再报 `'true' === 'true'`（常量赋值式被当值）→ 把正则收窄成 `customFrame:\s*` 对象属性形态；
3. 最终仍报 `CUSTOM_FRAME`（属性值本身是常量）→ 还要**解析常量定义**取字面量。

**规则（可做成断言）**：检查器读生成物时，**先剥注释再匹配**，且属性值允许「常量名」——
需回查 `const NAME = 'true'|'false'` 的定义。判据：把底本原样换成新病种，检查器应直接绿；
若不绿，问题在检查器不在项目。

### L29 · 五套测试是按底本**业务形状**写的，换病种必须整体重写而不是改常量

底本的 `store/server/import-export/demo-parity/ui-parity` 断言的是 `metric_points`、`documents`、
`candidate_fields`、私密分节 `vagina/sexual`。直接 `sed` 换病种名 → 31/42 红（不是环境问题，是形状不符）。
CLL 的 19 表与 cervical 的 18 分节没有任何一列同名。

**规则**：移植第一步先跑一遍底本测试，把红项按「形状不符 / 环境不符」分类；形状不符的一律
**按本项目 schema 重写**（本仓重写后 41/41）。改常量能让它变绿的那种改法是假绿。

### L30 · 「数据只有一个来源」要在**两处**同时钉住：生成器与原型

原型（视觉基准）与 demo 生成器（入库基准）各有一份血象序列时，日期与点数会悄悄分叉
（原型 10 点 2024-11 起 / 生成器 9 点 2024-03 起）。**正确方向是生成器服从原型**——
原型是签认过的视觉基准，生成器跟它对齐后，parity 测试才有意义。

**可断言**：`test/demo-parity` 里逐点 `deepStrictEqual(原型点位, 生成器点位)`，
而不只比点数或末值。只比末值时两条不同序列也可能通过。

### L31 · 装机目标 profile 不能凭 `~/.dsh` 推断

本机同时存在两套：`~/.dsh/profiles/desktop`（通用 CLI）与
`~/Library/Application Support/dsh-desktop/harness/profiles/web`（DSH Desktop app 实际使用）。
按 06 号做「装到 ~/.dsh」会**装成功但 Desktop 永远看不到**，而 `verify-desktop-load` 会如实报
「装机目录 未安装」。

**规则（可做成断言）**：装机前先读 `desktop-workbenches/state.json` 的 `added` 数组——
里面出现的 workbench 说明宿主认这个 profile；再用 `~/Library/Logs/DSH Desktop/harness.log`
里出现的 `profiles/<名字>/node_modules` 路径交叉确认。两处一致才动手装。

### 待实施⑦（下轮进检查器）

- `check-workbench-package`：移植自底本时，若 `package.json` 的 `files` 未包含运行时会读的目录
  （`schema`/`public`/`demo`），报红（与 NF 回流待实施⑤之②合并实现）。
- 新增 `check-derivative-leftovers`：扫 `dsh/ lib/ public/ src/ test/ scripts/` 里出现
  **底本病种名/底本品牌名**（如 `cervical`/`CerviPal`/`小莲宝`/`宫颈`）即报红。
  本轮实测残留 14 处（`src/client.js` 标题、`dev-server.mjs` 用法行、两个测试的 brand 断言），
  人工 `grep` 才清掉；这类残留会直接出现在患者界面上。

## 2026-10-25 · **假面孔 C：被空值骗过的真**

慢性粒细胞白血病工作台（小粒宝）第四轮独立评审抓到的，比前两副面孔更隐蔽——**它不是假失败也不是假通过，是一条"证据看起来完备"的假通过**。

```js
// 断言：关掉"治疗条"后曲线不变（16 号 R3 硬要求）
const before = path.getAttribute('d');
toggleTreatment();
const after = path.getAttribute('d');
assert(before === after);   // 恒成立——因为 before 和 after 都是空字符串
```

真实情况：绘图函数的调用方传 `[x, y]` 数组，函数只认 `{x, y}` 对象，`filter` 把点全丢了 → `d=""`。
**图上一根线都没有画出来**，而这条断言绿了整整一轮，自检里还写着「实测 True」。

同一轮第二例：图例写「全期口径」，基线实际取的是**窗口内**首点。切 6 个月窗口后基线从 42.6% 变 8.4%，
但"图例文字没变"这条也绿——因为没人核过基线的**来源**。

**修法与验收合同**：

1. **断言"不变"之前，先断言"有东西"**。顺序不能反：
   `assert(d.length > 0)` → `assert(bbox.width > 0 && bbox.height > 0)` → 再比 `before === after`。
2. **"不变"要比较所有会变的量**，不只最显眼的那个。本项目只比 `d`，漏了每个点的 `cy`——
   而缺陷恰好只动 `cy`（治疗条压缩了绘图区高度）。逐项列全：路径、坐标、bbox、容器高度。
3. **凡声称"口径 X"，断言必须核口径的来源**。写"全期口径"就要断言基线等于全期首点，
   而不是断言"这段文字没改过"。
4. **空窗口用例触发不了时记 SKIP，不记 PASS**。触发不了却记 PASS 等于假装验过。

**元教训（可直接做成断言）**：一条断言如果**在实现完全坏掉时也能通过**，它就不是断言，是装饰。
写完立刻想一遍"我把核心逻辑删掉，这条还绿吗"——本项目那两条都会绿。

## 2026-10-25 · 从神经纤维瘤病 v0.1.3 回收：profile 目录会被应用迁移

**【2026-10-26 修正：上一版这条把方向写反了】** 工作台 bundle 永远装 **DSH Desktop.app** 的
profile：`~/Library/Application Support/dsh-desktop/harness/profiles/web`（本地惯例：tgz 拷进该目录、
依赖写 `file:<tgz 文件名>`、bundles 数组登记、`CI=true corepack pnpm install --no-frozen-lockfile`）。
**不能**因为 `pgrep -fl dsh-desktop-host` 看见 DeepSeek Harness（Agent 宿主）的 argv 指向
`~/.dsh-classic/profiles/desktop` 就往那里装——Agent 宿主加载工作台 bundle 会把宿主搞崩
（NF 0.1.2–0.1.4 三轮装错位置，用户反馈"安装位置错误，导致 dsh 崩溃"后纠正）。
两个 app 的分辨判据见 1.5.7 节；激活的硬证据：DSH Desktop 的 web profile 数据目录里出现
`schema_migrations` 有记录的 sqlite（真目录模式不灌演示数据，表计数 0 是正确行为）。

## 2026-10-25 · 从神经纤维瘤病小纤宝 FibroPal（neurofibromatosis-workbench v0.1.2）回收

- **L26/L27 见上表**（真机 boot 的 ctx.config 未注入；files 漏 schema/）。**待实施⑤（下轮进检查器）**：`check-workbench-package` 增加——① `dsh/*.js` 出现 `ctx.config` 且对应 `apply(ctx` 无第二参 → 报错；② 存在 `dsh/store.js`（读 `../schema`）而 package.json files 缺 `schema` → 报错。
- **可复用结构（templates 挂钩）**：`templates/FLIP-METRIC-CARD.md`——分系列有序指标卡墙 + 正面当前值/背面最近记录与来源的 3D 翻转卡（含 reduce-motion 降级与键盘 Enter 支持），与 32 号折叠卡并列的第二个"原型即模版"结构；`prompts/ZERO-TO-DEV.md` 已在功能线清单挂引用。
- **流程规则**：自动领取前必须按 issues 搜索确认无人正在做（本轮 PF-ILD/地贫/儿童急淋均已被认领，BACKLOG 未认领池 ≠ issues 现实）；判读词黑名单在 NF 语境追加"恶变/癌变风险提示、遗传概率建议"两类（仅静态来源引用豁免）。
- **待实施⑥（既有失败，2026-10-25 实测）**：starter `npm test` 中 "ships the desktop-load verifier" 在本机失败——`verify-desktop-load.mjs` 在找不到 DSH Desktop harness 目录时直接抛「找不到…harness 目录」，没走到「界面加载核验」可读结论分支（test/starter.test.mjs:59 期望 `/界面加载核验/`）。该失败早于本次 NF 回流（stash 验证过），按不修绿纪律只登记不擅改。

## 2026-10-26 · 从急性髓系白血病（aml-workbench v0.3.0）回收

1. **判定对 ≠ 提示可见**。`classifyTemp` 的边界逻辑 11 例全过，纯函数断言 9/9 绿；
   但 UI 层 `onSave(vals); closeModal()` 把刚弹出的急症框当成录入框一起关掉了——
   家属录 38.5℃ **什么提示都看不到**，体温静默入库。5 个 check 全绿，红线已破。
   **切法（两条）**：
   - 表单保存回调要能"接管弹窗"：`const handled = onSave(vals); if (handled !== true) closeModal()`
     ——凡是 onSave 里会再开弹窗/对话框的，必须走这条；
   - 断言器必须有一层**源码级守卫**：grep 出「先关后弹」的调用顺序 + `dataset.emergency` 标记 +
     cancel/遮罩拦截。纯函数断言永远看不见 UI 编排。
2. **"不可忽略"必须写进事件拦截，不能只写文案**。急症框文案写着"不可忽略关闭"，
   但 `<dialog>` 默认 Esc 可关、遮罩 click 可关——全文件 `addEventListener('cancel')` 只有 0 处。
   **切法**：不可忽略对话框 = `dataset.emergency='1'` + `cancel` preventDefault + 遮罩点击忽略 +
   唯一出口按钮 + closeModal 时清标记（否则下一次普通弹窗也被锁）。
3. **"写进去"和"看得见"是两件事**。`mem().temps.push(...)` 写了，但 `grep mem().temps`
   三处全是写、无一处渲染——家人代记的体温曲线只能存不能看。**切法**：每个新写入点都必须
   配一条"写入后渲染出现"的断言（录 1 条 → 图上/列表里 +1）；这类缺失静态检查抓不到，
   要靠"写入点 → 读取点"双向 grep 核对。
4. **README 截图会静默腐烂**。同一目录存在 `-0.2.0`（新，1000px）与 `-v0.2.0`（旧，940px）
   两套，README 引用的是旧的，其中一张还是根本不存在的文件名（破图）。**切法**：
   截图产物入库前做三项断言——① 引用路径全部存在；② 全目录 md5 无重复；
   ③ 文件名版本 == VERSION；并删除旧命名的一套（两套并存必然引错）。
5. **SVG 标签要避让，位置由上一条决定**。hourLane 事件标签（12:40 / 13:10）、
   一图秀输注泳道（红细胞×1 / 血小板×1）都直接 `x+6` 绘制，实测包围盒相交叠印成黑块。
   **切法**：同泳道内按 x 排序，相邻 < 阈值则交替上下两行（配引导线）；
   一图秀末点标签的 `cursor` 避让模式可直接复用。
6. **schema 断言器要自校验哈希**。`check-schema.mjs` 不只查"有无判读列"，
   还比对 `freeze-contract.md` 里记录的 sha256 与当前文件——否则"冻结"只是口头约定，
   谁改一行 ALTER 都能悄悄过。反例测试：改一个空格即报"冻结被破坏"。

## 2026-10-26 · 从神经纤维瘤病 0.1.5 回收：激活失败的两个判据坑

- **L28 · mkdirSync(recursive) 返回值不可当路径**：`mkdirSync(dir, { recursive: true })` 在目标目录**已存在**时返回 `undefined`；把它传给 `join()`/`readFile` 等 → `TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string`。表现极阴：**首次安装能跑（目录被创建），之后每次重启必挂**，工作台从列表里消失。修复：mkdir 与拼路径分离（`mkdirSync(dir,{recursive:true}); join(dir,'db.sqlite')`），开库失败降级 503 + health `degraded`，不裸 throw；回归测试要"同一 root 连开两次"。
- **L29 · "装上了没有"的判据次序**：`Harness is ready` ≠ 每个 bundle 都激活；数据目录/工作台清单有痕迹 ≠ 界面看得见。正确顺序：① 看本次运行段（最后一条 `Harness process exited` 之后）有没有 `<plugin-id>` 的 error 行；② 看 profile 里 node_modules 链接与 bundles 登记；③ 最后才是人眼确认界面。

## 2026-10-26 · 从神经纤维瘤病 0.1.5 二次回收：Desktop 会自动禁用崩溃过的插件

- **L30 · 激活崩溃 → 自动禁用，之后"修好了也不出现"**：DSH Desktop 在一次 bundle 激活失败后，会往 profile
  `cordis.patch.yml` 追加 `- id: <plugin-id>\n  disabled: true`，并留 `cordis.patch.yml.pre-disable-<id>-<时间>` 备份
  （package.json 也有 `.pre-…-disable-…` 备份）。此后即使升级到修好的版本，条目仍被禁用，宿主启动段"干净无错"
  （因为根本没加载），列表里永远不出现。**排查"工作台不出现"的完整顺序**：
  ① `grep "id: <plugin-id>" -A2 profile/cordis.patch.yml` 看有无 `disabled: true`（有就删掉该条，删前备份）；
  ② 看 harness.log 本次运行段有没有 `<plugin-id>` 的 error 行；
  ③ 核 node_modules 版本与 package.json bundles 登记；
  ④ 最后人眼确认。

## 2026-10-26 · 从神经纤维瘤病 0.1.6 回收：ctx.effect 不是「注册清理函数」

- **L31 · `ctx.effect(fn)` 会立即执行 fn，fn 的返回值才是 disposer**。写成
  `ctx.effect(() => { close(db) })` 等于在 apply 阶段立刻关库；之后任何查询抛
  `Error: database is not open`，若 handler 是 async 且未被收口，就变成
  `unhandled rejection` → DSH Desktop 打 `dsh: fatal load failure` → 进入 plugin recovery
  并**自动写 `disabled: true`**（症状：工作台从列表消失，且启动段看起来"没有插件错误"）。
  正确写法：`ctx.effect(() => () => { try { close(db) } catch {} })`；路由守卫必须收口
  async rejection（`const out = handler(req,res); if (out?.then) out.catch(fail)`），
  否则"禁裸 throw"只覆盖了同步路径。回归测试两条：setup 阶段不得 close；async rejection 必须被捕获。

## 2026-10-26 · 从神经纤维瘤病 0.1.11 回收：「装上了但不出现」的三层判据

工作台在 DSH Desktop 里消失，可能是三层各自独立的问题，必须按顺序查完：

- **L32 · 市场层禁用最隐蔽**：profile 下 `.dsh-market/state.json` 的 `disabled` 数组会整包禁用插件；
  日志只有 `toggle: <pkg>: no loader entry matched`。此时 cordis.patch.yml 干净、包与 bundles 都在、
  代码也修好了，但 loader 根本不挂载 → 启动段"无错误"、界面永远不出现。
  核对：`cat <profile>/.dsh-market/state.json`，把本包从 disabled 移除（关应用后改，或走市场 UI 启用）。
- **L33 · 客户端 register 引用未定义变量**：描述符里写了只存在于组件内部的 state（如 healthVersion），
  register 每次抛错；症状同"没注册"。smoke-activate 能抓到，但它默认测 **profile 里已安装的拷贝**——
  改仓库后要先重装（或显式传目录）再跑 smoke，否则测的是旧包（本轮即因此漏报两小时）。
- 三层排查顺序：① `.dsh-market/state.json` disabled → ② profile `cordis.patch.yml` 的 `disabled: true` →
  ③ 本次运行段 `<plugin-id>` error / `no loader entry matched` → ④ node_modules 版本 + bundles → ⑤ 人眼。
## 2026-10-26 补 · 从急性髓系白血病 0.3.2 回收（真机加载不起来）

7. **`ctx.<any> = …` 必须先 provide，否则整个插件不激活**。小橙宝把诊断信息挂到
   `ctx.amlWorkbench`，`inject` 里没有、`provide` 也没声明；本地 `smoke:activate`
   **全绿**（桩件不校验 provide），装进 Desktop 后宿主日志只有一行
   `cannot set property "amlWorkbench" without provide`，界面上就是"加载不起来"。
   **切法（两条，都已落地）**：
   - 诊断信息别挂 ctx：走 `bootstrap` 响应的 `source` 字段、事件回调或 return 值；
   - 静态断言 `templates/check-ctx-provide.mjs`：扫 `ctx.<key> =` 是否都在
     `export const provide` 里（框架键白名单），正负例各一条。
8. **"桩件通过"是装机面最危险的假绿**。这条与 0.2.4 的"截图文案"、GBM 的"register 七条"
   同类：凡是**只有真宿主才走到**的校验，必须在开发期静态化或用真宿主探针，
   不能拿桩件全绿当装机通过。判据：桩件只验"我调用了什么 API"，不验"宿主允许什么"。

## 2026-10-27 · 从神经纤维瘤病 0.1.14 回收：degraded 字段早就说了实话，别只看 200

- **L36 · npm `files` 与运行时读路径的第二变体**：L27 是 schema/，这次是 **demo 唯一源文件**
  （`prototypes/v0.1/demo-data.js`）。凡代码里 `new URL('../…', import.meta.url)` 读的文件都要进 files；
  装机后EN OENT 会让 openStore **降级**（degraded=true + STORE_UNAVAILABLE），界面全空但不报错、
  health 仍 200——极易被当成"装好了只是没数据"。对策：health 的 `degraded`/`storeError` 字段
  是一等信号，装机验证先 `curl /health` 看这两个字段；check 断言"运行时读的每个相对路径都进 files"。
- **L37 · 真机空库注入演示数据是 M5 家族惯例**：空库（subjects=0）时 seedDemo（demo_meta 标记
  `demo=true`），客户端顶栏/看板明示「演示数据，与原型同一份 demo-data 唯一源」；已有真实数据
  （subjects>0）绝不注入。这样 M5 真机界面与原型逐像素同源，v0.2 写入闭环再引入真实数据。

## 2026-10-26 · 从多发性骨髓瘤小浆宝 MyeloPal 回收：临床快照要逐字段比对 JSONL 与 SQLite

症状：manifest 与 JSONL/SQLite 均显示 257 条、摘要 hash 均匹配，SQLite `integrity_check=ok`，但 49 条 CTV 记录的 sponsor 在 JSONL 有值、SQLite 为 NULL。只验总数和文件摘要无法发现映射遗漏。

**L40 · 临床快照核验必须把主键映射字段逐行对齐**：按 `record_id` 比较 JSONL 与 SQLite 所有共享业务字段（含 JSON 序列化列），并同时核对 manifest 计数/hash、SQLite integrity、重复主键和 source_statuses 数量/重复项。检查器只读打开数据库；不得通过重采或重建快照来代替复核。

- 新增 `templates/check-trial-snapshot.mjs`，初始化后下发为 `scripts/check-trial-snapshot.mjs`；新项目 `check` 链对无快照项目显式 SKIP，已有临床快照逐字段核对。
- 回归夹具分别验证完整映射通过、JSONL sponsor 丢失映射时报错、无快照只有 `--if-present` 可跳过。
- 本次原项目数据保留未改；检查发现 M4 未通过， sponsor 缺失仍待单独获授权修复或新版本采集。

## 2026-10-27 · 从神经纤维瘤病 0.1.16 回收：Desktop 侧 UI 的正解是「原型即 iframe」

- **L38 · 手写第二套 React 界面必被用户打回**：Desktop 模式下家族标准是 customFrame 客户端 +
  服务端 `/api/<slug>/ui/` 静态承载**已签认原型**（index/style/app/demo-data 进 files），
  客户端只做：顶栏（AI 对话按钮/版本/说明）、iframe 业务区、原生会话挂载、splitter 25–45%、
  收起不卸载。照抄同 profile 兄弟包（如 narcolepsy）的 client.js 做字符串级移植最快，
  主题色/文案/消息类型（如 `nf:agent-draft`）替换干净即可；iframe 内用
  `window.parent.postMessage({type:'<pkg>:agent-draft', prompt})` 把草稿交给原生会话。
- **L39 · 批量替换必须 assert**：python/脚本对源码做字符串替换时，替换目标不存在会让修复
  静默失效（本轮 imports 替换漏掉 → ReferenceError → 条目 did not activate → 路由 404）。
  规矩：每个 replace 后 assert 变化确实发生；装机验证用带鉴权 curl 对比 401（存在）/404（未挂载）——
  全站 auth 中间件下 401 恰恰证明路由已注册。

## 2026-10-27 · 从乳腺癌 / 食管癌 / 甲状腺的 36 号回补回收：开发版接入四问

- **L40 · 顶栏「?」必须手写，自动挂载会被看板按钮抢走**：`disease-primer.js` 的 `mount()` 逻辑是
  「DOM 里已有 `[data-primer-open]` 就接管它，没有才插一颗」。而 §2.6 状态卡的出口按钮排里本来就有一颗同名文字按钮，
  业务 `app.js` 又先于模块的 `DOMContentLoaded` 把看板渲染完 —— 结果自动挂载接管的是**状态卡里那一颗**，顶栏永远空着。
  更坏的是 **P1 照样 PASS**（`querySelector('[data-primer-open]')` 拿到的正是状态卡按钮，text / aria-label 都对），
  只有打开页面肉眼看顶栏才发现少东西。规矩：顶栏触发钮一律手写在 `.top-actions` / `.tb-actions` 里，
  让它成为 DOM 里第一个触发钮；状态卡那颗继续用文字，两处入口并存是 §2.6 允许的。
  **交付前必须看一张首屏截图**确认顶栏右侧真有「?」，只跑 P1 会漏。
- **L41 · 开发版的 `index.html` 要与原型逐字符一致，别自作聪明补 aria**：多数仓的检查链里有一条
  ui-parity 断言「index.html 与原型只允许差 title / 版本号 / favicon / noindex」。给触发钮补
  `class="dp-trigger"` + `aria-controls` + `aria-expanded`、或换一版更长的 `aria-label`，都会判红 ——
  因为 `mount()` 接管时自己会补齐这些属性，页面不该写。要真需要改骨架，就同步改原型，两边一起动。
- **L42 · §2.6 状态卡与业务首卡冲突时，定「通用骨架首卡在上、业务首卡在下」**：食管癌 `SPEC.md` 原写
  「吞咽卡为首卡」，体检 / 看板类项目容易都有一张「这就是我这病最要紧的那件事」的业务卡。两卡回答的不是同一个问题
  （位置感：我在第几天、下一步谁排的 vs 业务重点：今天能吃什么），并列会打架，串行才成立。
  改 SPEC 时把理由写进去，避免下一个人又改回去。状态卡出口按钮排的**主按钮进当前阶段核心页、副按钮开疾病概要**。
- **L43 · primer 模式件版本漂移别批量覆盖**：25 个仓里 23 个的 `primer.js` 比 starter 落后，但差距往往就是
  `s.entry`（官方入口页）那 10 行，而这些仓既没有同源检查闸、数据里也没用到 `entry` —— 批量覆盖只是制造 churn。
  正确顺序：先 grep 该仓 `scripts/build-primer-data.mjs` 有没有把「模式件与源一致」写进 `npm run check`；
  有闸的仓才必须同步（否则 check 恒红），没闸的仓等它下次动 primer 时顺手带上。

## 2026-10-27 · 从小肺宝临床试验模块（0.1.2-rc.19）回收：分数怎么才不骗人

用户对 G2 demo 的原话是「好多了，按照这个开发」，交付后又补了一句「临床查询做的特别好」。
真正值钱的不是夸，是这中间实测暴露的四个缺陷——它们都**不报错、不崩、看起来很正常**，只是悄悄把结论说错。

- **L44 · 跨侧比较的字符串必须来自同一份词表**：档案侧写 `'晚期转移'`、登记侧写 `'晚期/转移'`，
  于是 `facts.scope === '晚期转移'` 恒为 false，每一类都落到「待确认」。症状极具欺骗性：分数偏低、
  待确认项多到像用户资料不全，但代码一个字都没报错。规矩：跨侧比较不许两边各写一份中文字面量，
  提到常量表（或先 `normalize` 再比）；写完立刻用「两边答案都已知」的样本跑一遍，确认能出 `met` 而不是清一色 `unknown`。
- **L45 · 反向条件不显式反转，就把阳性档案判成「对得上」**：登记标题写 `EGFR Wildtype`，原实现只要见到 `EGFR`
  就给 `met`，`EGFR L858R` 被判「位点对得上」——方向正好反了，而这类误判最容易被当成「匹配上了」。
  规矩：抽条件前先判极性，`wildtype｜野生型｜未突变｜阴性｜negative` 出现时，语义是「不得有该变异」。
  可断言的测试：同一份阳性档案，对「EGFR 突变入组」与「EGFR 野生型入组」两条登记，必须一案 `met` 一案 `unmet`。
- **L46 · 「一条判据对上」不能变成 100%**：快照读不出疾病范围时分母只剩病理一条，`1/1 = 100%`，用户看到的是
  「完全符合」。三条守则：`crit.length < 2` 不给百分数（只给「需补充信息」）；病理未确认时整页不排名；
  读不出的字段记「待确认」，不要为了凑分母把「不适用」算成「符合」。检查法：只有病理记录的档案
  + 标题读不出场景的登记，断言页面**不出现任何百分数**。
- **L47 · 断言整棵虚拟 DOM 的文本会连 `<style>` 一起匹配**：`textOfTree(tree)` 把样式文本也拼了进来，
  CSS 里有 `width:100%`，于是 `assert.doesNotMatch(text, /\d+%/)` 永远失败，而页面其实没有百分数。
  反方向同样成立：`assert.match` 可能因为 CSS 里恰好有同名字符串而**假通过**。规矩：比对页面文案前先按类名过滤节点
  （`flatten(tree).filter(n => /wb-trial-card/.test(n.props?.className))`），或让 `textOfTree` 跳过 `style` / `script`。
- **L48 · 假 React 测试不执行 effect：写在 effect 里的逻辑等于零覆盖**：自建假 React 只跑 render，
  `useEffect` 只登记不执行。好处是 effect 里可引用后面才 `const` 定义的函数（真实执行在 render 之后，TDZ 已过），
  坏处是 effect 里的判定（请求去重 key、`Esc` 关浮窗、焦点回收）一条都没被测到。规矩：把 effect 的业务判定抽成
  纯函数（`trialRequestKey(caseFile, hist)`）单独测，effect 只留接线。另：hook 顺序按索引钉死，插一个新 `useState`
  会让后面全部平移——改完先 `grep -c "React.useState"` 数实际个数，再同步 `HOOK` 映射与 `hookCount`。
- **L49 · 原型增量生成脚本必须断言「唯一命中」并核对 base64 段数**：从冻结基线生成新原型靠字符串替换，
  某段出现两次就会换错位置；整段水印 `data:image/png;base64` 会在大段替换中被连带删掉 296 KB。
  规矩：每个 replace 后 `assert s.count(old) == 1`，改完核对 `data:image` 出现次数不变、文件大小变化量在预期内；
  **生成脚本本身要入仓**——本轮它差点漏提交，就因为没人看未跟踪文件列表。
- **L50 · 发布资产回验用 `gh release download`，不要 `curl` 直连**：`curl -sL .../releases/download/...`
  在本机代理环境下拿到的是 9 字节 `Not Found`，sha256 自然不符，会被误判成「资产损坏」。
  规矩：`gh release download <tag> -D <tmp>` 再 `shasum -a 256`，与本地包逐字节比。

## 2026-11-04 · 从小宁宝 TTP 工作台（ttp-workbench v0.2.1 装机迭代）回收：三处「不报错、只坏一半」

一轮无人值守夜班跑完 M0–M9，装机闸口抓到三个**检查链全绿但装机即坏**的坑，全部可断言化：

- **L51 · 生成代码里的注入令牌禁止挂在 `window` 上**：`migrate-public` 生成 `window.__API_BASE__`，
  宿主把令牌替换成挂载前缀后变成 `window./api/ttp` → 业务帧**整帧脚本语法错误**，界面只剩外壳、
  主区空白，且 harness.log 没有任何指向本包的报错行（四个激活失败全是别的仓）。独立启动 API_BASE=''
  时同样看不出。规矩：令牌只以字符串字面量 `"__API_BASE__"` 形态出现在生成物里；断言器
  `check-public-tokens.mjs`（ttp 仓首例）扫 `window.__API_BASE__` / `window.__VERSION*`。
- **L52 · 双形态字段名必须同源取自一行代码**：fetch 脚本 jsonl 写 `sponsor`、SQLite 插入读 `r.sponsors`，
  库内全 null，`check-trial-snapshot` 一口气报 179 处 field mismatch——检查器红得很对，
  但 AML 底本带着同款 bug 存活至今，说明**这条检查没进底本的 check 链**。规矩：采集脚本的
  jsonl 行与 insert 行从同一个变量取值；snapshot 一致性检查进每仓 check 链。
- **L53 · pack 白名单缺目录 = 装机激活四连挂**：`dsh/demo.js` import `../demo/build-demo-data.mjs` 而
  `files` 缺 `demo/`，同一晚 esophageal / gastric / gist / colorectal 四个仓在宿主里集体
  `ERR_MODULE_NOT_FOUND` 激活失败（ATTR 0.2.1 踩过的同款坑，第五、六、七、八次）。
  规矩：dsh 内相对 import 的每个目录都必须出现在 `files`；装机后 `harness.log` 本次运行段
  grep 本包 id 必须 0 报错（`verify-desktop-load` 已脚本化，装机后必跑）。

回流落点：ttp 仓 `scripts/check-public-tokens.mjs`（建议升进 starter templates）；`check-trial-snapshot.mjs`
已在 starter check 链，补「每仓必须含」断言；L53 建议在 `check-conformance` 加「dsh/*.js 相对 import 目录 ⊆ files 白名单」断言（待实施清单）。

## 2026-11-05 · 从小宁宝 TTP 工作台（ttp-workbench v0.2.8 Inspector 轮）回收：三处「界面说了假话」

独立 Inspector 按 A–I 清单审出 16 项失败，其中三类是**界面自述与数据层不一致**，都可断言化：

- **L54 · 界面里的通道终态必须从状态表生成，不许手写**：设置页写「ictrp 两次 FAILED」，而快照
  `source_statuses` 实为 `SUCCESS ×3 + NO_RESULTS ×3`、0 FAILED——用户看到的是「外部服务坏了」，
  实际是「查过、没有命中」。规矩：任何「哪个通道成功/失败/无结果」的文案必须由
  `SELECT source_id, state, COUNT(*) FROM source_statuses GROUP BY 1,2` 的结果渲染（或构建期生成常量），
  禁止在 UI 文案里凭记忆写 FAILED/成功次数。检查法：设置页文案与 sqlite 查询结果逐来源对账。
- **L55 · 检索关键词的医学缩写歧义会直接把无关试验推给患者**：`\bTTP\b` 同时命中
  「thrombotic thrombocytopenic purpura」与「transversus thoracic plane (TTP) block」——检索页第一条
  推的是乳腺手术麻醉研究。规矩：病种快照过滤只认**全称/病名/罕见病目录名**（如
  thrombotic thrombocytopenic purpura、血栓性血小板减少性紫癜、Upshaw-Schulman），缩写只在标题同时
  含病名语境时才算；生成脚本把筛选口径写进文件头注释，并保留「全部载入 N 条」的卡头口径。
- **L56 · 掩码方向与文案必须同源，表单草稿跨 tab 不得丢**：Token 掩码显示 `sk-8f2c****`（露前缀）却写
  「只显示后 4 位」；且切换设置 tab 后已输入的 Token 草稿被清空。规矩：掩码由真实值派生（`****` + 末 4 位），
  文案与实现同一处生成；设置页 tab 切换只换内容区，表单草稿存 state（或切 tab 前落草稿），不许重建整个表单。

回流落点：ttp 仓 `scripts/check-trial-matching.mjs` 增加试验线触发与扫描面（prototypes 也扫）、
`scripts/build-trial-demo-data.mjs` 的严格筛选口径与文件头声明；L54 的「UI 文案 ↔ 状态表」对账断言
列入检查器待实施清单（当前靠 Inspector C4/E10 人工对账）。

## 2026-11-05 · 从小弓宝大动脉炎工作台（takayasu-workbench v0.2.0 首夜 M0–M6）回收：parity 与探针四课

- **L57 · 手写 demo 数据的可选键 null 两态并存，parity 必须走 canonical JSON**：demo-data.js 里
  同一结构有的行写 note: null、有的行直接省键——读模型固定键集输出后逐字节比对必炸。
  规矩：parity 测试用 canonical（递归删 null/undefined 键）比对 + 读模型输出固定键集；
  「形状一致」以语义等价定义，写进测试头注释。检查法：test/demo-parity.test.mjs（takayasu 仓可抄）。
- **L58 · profile 指标数组顺序 = metric_def ord**：readBootstrap 按 def 顺序聚合、demo 手写顺序
  随意 → 数组顺序逐字节不一致。规矩：唯一源 demo-data.js 的 metrics 数组按 metric_def 顺序写；
  readBootstrap 跳过零点数组。来源：takayasu demo-parity 三轮返工。
- **L59 · 事实列命名要预判判读词钝正则**：diagnosis_date（确诊日期，事实）撞上 /diagnosis/i
  判读列断言。规矩：日期/原文类事实列命名避开判读词根（diagnosis/risk/severity/grade/verdict…），
  确诊日期用 first_confirmed_date。检查法已模板化：templates/check-schema.mjs（判读列 0 命中 +
  freeze-contract sha256 同源），首夜即断言。
- **L60 · 视口锁定 + scroll-behavior:smooth 让程序化滚动异步化**：#main smooth 滚动下
  scrollTop = 140 赋值立刻读回是 0，A5「滚动恢复」假红。规矩：探针滚动用
  scrollTo({top, behavior:'instant'}) 或等待 ≥250ms；同族教训——异步 history.back() 会污染
  后续 history.length 断言，history 类验收用「hash+state 进出」行为学证明或 fresh goto 隔离。

回流落点：starter templates/check-schema.mjs（L59 检查器模板化，首例来自 takayasu）；
demo-shape 0002 迁移模式（冻结后 ALTER TABLE ADD COLUMN 可空补列）写入 14 号数据合同待办。
- **L61 · 残留检查器自扫自爆**：check-derivative-leftovers.mjs 的词表、doc 示例与自测脏样本
  （小莲宝/CerviPal 字样）会被它自己的 SCAN_DIRS 扫到，新项目首夜 check 必假红 37+ 处。
  规矩：scanProject 自排除 `resolve(f) === fileURLToPath(import.meta.url)`；错误来源 aatd-workbench
  2026-11-05 首夜（M0 起 EXIT 读取被管道截断掩盖了三天假红）。检查法：starter scripts/ 与
  project-template/scripts/ 双份都已修，`node scripts/check-derivative-leftovers.mjs .` 应 0 命中。
- **L62 · 事件委托分支与 data-* 缺一对，点击静默无效**：按钮只写 data-range 不写
  data-action，委托处理器 `closest('[data-action]')` 永远不命中，UI 不报错但功能死的。
  规矩：新增委托动作时 data-action 与取值属性成对出现；探针必须「真点击后断言 DOM 变化」
  而不是查控件存在（aatd C8 探针先红后修的真实案例）。
- **L63 · 窄时间窗空序列把 render 炸断，UI 静默不更新**：lastPos 对 pts=[] 取
  `last.x` 抛 TypeError → render 中断 → innerHTML 不替换 → 界面停留在旧状态，无任何报错。
  规矩：读模型/视图层对「窗口内 0 点」显式分支（跳过该序列或整图空态），空态必须带下一步按钮。
- **L64 · 私密改写链口径**：私密记录被更正为公开后，旧私密原文仍不得出现在看板/导出/AI
  三出口。过滤函数按 corrected_by 链溯源：链上任一版本 is_private=1，则该链旧原文一律不出口；
  最新公开版本可出口。演示数据要有「旧私密→新公开」改写链示例供断言（aatd 独立评审 P1④）。
- **L65 · 探针操作 render 后的 DOM 必须重查节点**：innerHTML 替换后旧引用是脱节点，
  对它 click() 不会冒泡到 document 委托器，动作静默无效且探针会误报「功能失效」。
  规矩：每次 render 后重新 querySelector 再交互；探针内连续两步操作同一容器时尤其注意。

## 2026-11-05 · 从小宁宝 v0.2.9 回收：路由与装机验证的两处「归属错误」

- **L57 · UI 路由禁止写死字面量，必须从 API_PREFIX 派生——否则多仓互撞**：takayasu-workbench（大动脉炎）
  从 ttp-workbench 复制模板后，`dsh/index.js` 仍写死 `path: '/ttp'`（客户端 iframe 却加载 `/takayasu/`）：
  ① 与 ttp-workbench 的 `/ttp` 相撞 → 宿主 `duplicate prefix route`，一个插件激活失败；
  ② 即使不撞，客户端请求自己的路由也 404（SPA 兜底把 index.html 当 JS）。
  规矩：`path: '/' + API_PREFIX`；断言器 `templates/check-route-prefix.mjs`（API_PREFIX ↔ 包名 slug ↔
  客户端 UI_ENTRY ↔ dsh 注册路由 四者同源，禁写死前缀字面量）进每仓 check 链。
- **L58 · 「本次运行有 N 个插件失败」不等于「本包失败」**：装机校验脚本只按 `did not activate`
  一刀切时，profile 里 4 个兄弟仓缺 `demo/` 打包的失败会把本包判成激活失败（2026-11-05 实测，
  `verify-desktop-load` 直接给出 ✗ 结论）。规矩：按包名/插件 id 归属失败行；只有别人的失败 → 警告并列出 id；
  只有不带包名的计数行 → 按失败处理（保守），不许放行成通过。
  `templates/verify-desktop-load.mjs` 已按此规则更新（归属正则同时认 `(pkg): failed to import` 与
  `id-main: Error`，并过滤 `web-server`/`llm-*` 这类非插件错误）。
- **L66 · 升版重装必须先 remove 旧 tgz**：Desktop profile 的依赖是
  `file:…/<包名>-<旧版>.tgz`，重打包删了旧文件后直接 `pnpm add` 新 tgz 会报
  ENOENT（pnpm 先按旧 file: 引用校验）。规矩：`pnpm remove <pkg>` → `pnpm add -w <新tgz>`。
  错误来源：aatd-workbench 0.6.0 重装实测。
- **L67 · 迁移加可空列，`SELECT *` 的 deepStrictEqual parity 立刻红**：bootstrap 用
  `SELECT *`，新列（值为 NULL）会出现在读模型行里，而唯一源 demo-data 的旧行没有这些键。
  规矩：迁移加列时同一提交里给唯一源补同名字段（值可为 null），并把 migrate 测试的
  `executed` 断言更新到新账本。错误来源：aatd 0002 visits.hospital。
- **L68 · 检查器词表也会误伤注释**：T2 类「命名禁词」与 eligible 不同，最初直接扫原文，
  doc 注释里写「不设 suitability 字段」即假红。规矩：与 eligible 的「只认结构形态」同思路，
  扫前 stripComments；自测加「注释提及不算命名」回归例。错误来源：aatd 实测误报 + 修复。
- **L69 · 批处理脚本用相对路径 + 持久 shell cwd 漂移 = 补丁打到别的副本**：同仓两份
  同名文件（templates/ 与 scripts/）时，`python3 - <<EOF` 里的相对路径按当前 cwd 解析，
  上一条命令的 `cd` 会让补丁落错文件还不报错。规矩：Agent 批处理一律绝对路径或先显式
  `cd` 并在同一条命令里完成；改完 diff 校验两份副本一致。

## 2026-11-06 · 从软骨发育不全小苗宝 GrowPal（achondroplasia-workbench v0.2.0）回收

### L61 · 演示数据的业务 id 在**档案内**唯一，不是全库唯一

demo-data 里 documents/candidates/surgeries 的 id（doc1/c1/s1）在两个演示档案里重复出现
（A、B 档案都有自己的 doc1）。schema 若把它们当全库主键（INTEGER 或 TEXT PK），
播种第二步就撞 UNIQUE / datatype mismatch（`test/demo-parity.test.mjs` 当场抓到）。
修法：表用代理主键 `id INTEGER` + 业务列 `doc_id/cand_id/surg_id TEXT`（`UNIQUE(profile_key, 业务id)`），
读模型对外形状还原业务 id。0 修正两次 schema 才落对——**先数一遍演示数据的 id 语义再写 PK**。

### L62 · 数据层的可变绑定：`const DATA` 会让 api 态静默退回演示态

原型与开发版共用的渲染代码里，`loadBootstrap()` 成功后 `DATA = data`。
`DATA` 若是 `const`，赋值抛 TypeError，被 loadBootstrap 的 catch 吞掉返回 'demo'——
界面不报错、横幅写「离线演示数据」，看起来像"没连上服务"，实际是代码 bug。
修法：`let DATA`；且 loadBootstrap 的 catch 里 console.warn 真实错误（别静默）。
浏览器双形态实测（dev-server /ui/ vs file://）是唯一能抓住它的闸口。

### L63 · 检查器的正则要先剥注释（L28 的延伸，已模板化）

`check-host-contract.mjs` 的 customFrame 正则不剥注释时：
build 头注释「面板 customFrame=true · 业务 left 0.65」被当成代码值，报
"不是 true/false 字面量：true · 业务 left 0.65"。本次已在
`templates/check-host-contract.mjs` 落 `stripLineComments` 修复并随 init 下发。
**通用规则：任何"从源码里抠值"的断言，先剥 `//`、`*`、`/*` 行再匹配。**

### L64 · `overflow:hidden` 在 3D 翻转内层会把 preserve-3d 拍平（镜像前脸，探针却不红）

指标卡 `.mcard-inner` 上为了裁圆角加了 `overflow:hidden`——它是分组属性，
强制 `transform-style` 按平坦处理：180° 后浏览器画的是**前脸的镜像**（背面元素都在、
computed style 全对：backface-visibility:hidden、preserve-3d、matrix3d(-1,...)），
肉眼看到"翻过去了但内容是反的"。探针只断言 transform 字符串与 aria-pressed，抓不到。
**出处**：2026-11-06 小苗宝 GrowPal 看板对齐轮，重摄截图时肉眼发现。
**修法**：内层不加 overflow（圆角由 `.mface` 双面各自的 border-radius 承担）；
检查器加固方向：对翻转后的卡截图/像素采样，或断言 `.mcard-inner` 无分组属性
（overflow/clip-path/filter/mask 均会拍平）——见 templates 待实施清单。

### L65 · 用默认参数「重置状态」的弹窗：`openSettings(tab = 'ws')` 每次无参调用都把 tab 拍回首页

设置三 Tab（C1：切换互不丢状态）改用模块级 `cfgState` 后，把无参调用写成了
`openSettings(tab = 'ws')`——`case 'cfg-tab'` 里 `openSettings()` 一调，默认参数又把
tab 拍回「工作区」，勾选看似丢失。computed style 与 DOM 都"对"，纯逻辑回归。
**出处**：2026-11-06 小苗宝 GrowPal AI 按钮/设置轮，浏览器实测抓到。
**修法**：默认参数用 `null`（=保持现状态），只有显式传参才切换；
tab 切换时同步 `cfgState.tab` 再重渲。**规则：有状态容器的弹窗，无参调用语义必须是"保持"，不是"重置"。**
- **L70 · 检查器跑在参考页上 ≠ 跑在你的页面上**：probe-disease-primer 10/10 全绿，
  但它打的是 starter 的 examples/disease-primer.html 参考实现——项目原型里 ? 按钮
  从未接线（dpOpen 无任何调用方），面板模块写了却永远打不开，闸口看不见。
  规矩：每个 P/A/X 组探针除了参考页，必须至少一条「在项目原型上点真按钮」的断言
  （aatd 已把 primer 接线断言固化进 probe-m2-extra 的 P-home 条目）。
  错误来源：aatd-workbench 2026-11-07 用户实测「? 打不开」。

### L66 · 越级相对路径（`../assets/...`）在装机态必 404：UI 挂在 `/api/<slug>/ui/`

小宁宝（ttp-workbench 0.2.9）用户实拍：装机后顶栏「?」与状态卡「疾病概要」两处点击无效。
根因不是点击逻辑：`primer.js` 用 `../assets/patterns/disease-primer.js`（原型 `../../assets/...`）引用，
装机态 UI 由 `/api/ttp/ui/` 提供，`../` 解析成 `/api/ttp/assets/...` → 静态层不服务 → 脚本 404 →
`window.DiseasePrimer` 未定义 → 所有 primer 入口哑掉（页面无报错，纯静默）。
**修法**：primer.css/primer.js（及一切共享资源）**同目录化**——原型目录与 public/ 各放一份、
引用写 `primer.css`，file:// 与 /ui/ 两种形态同一路径（aml/小苗宝同款）。
**可断言**：`check-static-refs.mjs` 增加规则——本地引用不得含 `..` 段（0.2.10 起 ttp 已进链，模板同步）。

### L67 · 聚合数字也是隐私出口：sharedOnly 必须喂进派生计算源，不能只过滤明细列表

**现象**：明细列表（最近报告、化验表）都走了 sharedOnly，但「近 90 天发作 N 次 / 当前状态 /
起始日期」这类聚合与派生数字直接用了未过滤数组——私密发作的时间与次数从状态卡、导出预览、
AI 上下文三处泄漏。探针全绿（demo 数据里没有私密发作，路径没被触发）。
**出处**：2026-11-07 复发性心包炎工作台首夜，独立 Inspector 静态审查抓到（探针未覆盖）。
**修法**：派生函数（derivedStatus 等）一律以 sharedOnly(原始数组) 为输入；页内标注「私密 N 条未计入」。
**检查器方向**：探针 demo 数据固定含 1 条私密事件，断言聚合数字与共享计数一致、页面含「未计入」
标注（pericarditis-workbench probe-pericarditis-m2.mjs 的 Q35c 可直接模板化）。

### L68 · 整页视图关闭后焦点回不到触发元素：history 导航会重置焦点 + 重渲染会拆掉触发元素

**现象**：applyPvClose 里同步 trigger.focus() 无效——history.back() 之后浏览器把焦点重置回 body；
且关闭触发 hashchange → 全页重渲染，原触发元素已脱离 DOM（isConnected=false，focus() 无声失效）。
**出处**：2026-11-07 复发性心包炎工作台首夜，probe-page-view A4b 实测。
**修法**：① 关闭时按 data-open 特征重定位触发元素再 focus；② 导航落定后（≈60–250ms）补一次 focus；
③ 探针在读焦点前等稳态（pericarditis 仓 probe-page-view A4b 加了 250ms settle，判据未弱化）。

### L69 · 一图秀只拼 svg 子元素、忘包 `<svg class="chart">` 根：页面「看着有内容」，fill=none 探针全空

**现象**：chartPanel 的字符串拼了 rect/path/text 但没有 `<svg>` 根标签，浏览器把子元素当未知标签
丢弃；IP2 非空断言仍绿（页面文字多），只有 C1a 的 path 断言红。
**出处**：2026-11-07 复发性心包炎工作台首夜。
**规则**：任何手写 SVG 的渲染函数，第一行开根标签、最后一行闭根标签；探针必须先断言 path 数 > 0。

### L70 · 窄宽断点里 `grid-template-columns: 1fr`（无 minmax(0,1fr)）是 390 横向溢出的头号根因

**现象**：900 断点把 workspace 改单列用了 `1fr`，grid item 的 min-width:auto 被 673px 的导航撑破，
documentElement.scrollWidth=701；逐元素排查时溢出源在 grid 容器不在内容。
**出处**：2026-11-07 复发性心包炎工作台首夜（30 号规则第二次实锤）。
**修法**：所有断点改列的 grid 一律 `minmax(0, 1fr)`；flex 侧栏加 `min-width: 0`。

### L71 · check-probe-coverage 的 ROUTES 对象式解析要求值必须是 `pageXxx` 函数名

**现象**：顶层 `const ROUTES = { 'dash': true, ... }` 正则能匹配但 0 条路由被解析（值不匹配
`page[A-Za-z0-9]+`），报「找不到 ROUTES」。检查器故意只认 page 函数值，防把其它字面量当路由。
**出处**：2026-11-07 复发性心包炎工作台首夜。
**修法**：渲染函数挂 window 后按名引用（`'dash': pageDash`）；模板项目第一天就要这样写，不是检查器 bug。

### 待实施⑧（下轮进检查器）

- `probe-m2-aggregate-privacy.mjs`（模板化 pericarditis Q35c）：demo 数据固定含 ≥1 条私密事件 +
  ≥1 条私密发作，断言：状态卡聚合数 == 共享计数、导出预览与 AI prompt 不含私密原文、页含「未计入」。
- `check-ui-parity.mjs` 上收为家族模板（pericarditis-workbench 已实现：public 与 prototypes 同名文件
  逐字符 diff + 白名单替换点还原断言），进 ZERO-TO-DEV 交付清单挂钩。
- probe-page-view 契约的「触发元素重定位 + 焦点 settle」写进 32 号文档附录。

### L72 · 构建注入的布尔常量要「裸占位直注」，检查器捕获要 trim 尾分号

**现象**：mds-workbench 首夜，`build-client.mjs` 注入后生成物里是
`const CUSTOM_FRAME = 'true' === 'true'`（表达式形态，检查器判"非常量字面量"）；
改成裸占位后捕获又带出 `true;`（行尾分号被 `[^,}\n]+` 一起吃掉）。
**出处**：2026-11-07 骨髓增生异常综合征（MDS）工作台首夜（L28 的续集）。
**修法**：src 里写 `const X = __X__;`（不加引号），构建注入纯字面量 `true/false`；
检查器提取后 `.replace(/;+$/, '')` 再判。mds-workbench 的 scripts/check-host-contract.mjs
已带 trim，可上收进模板。

### L73 · 生成器写演示 sqlite 必须先删后建

**现象**：`demo/build-demo-data.mjs` 第二次运行报 `table profiles already exists`——
`DatabaseSync` 打开已存在文件后再跑一遍 `CREATE TABLE` 直接炸。
**出处**：2026-11-07 MDS 工作台首夜。
**修法**：写库前 `rmSync(path, { force: true })`；sqlite 产物永远全量重建，不做增量。

### L74 · check-version 的 FROZEN_PROTOTYPE 是「每仓自己的原型签认版本」

**现象**：模板默认 `0.1.0`，MDS 原型签认在 v0.2.0，8 处版本核对全红在快照。
**出处**：2026-11-07 MDS 工作台首夜。
**修法**：init 之后第一步就把 FROZEN_PROTOTYPE 改成本仓原型实际签认版本；
它是「快照冻结点」不是通则常量。

### L75 · probe-disease-primer 不带 --url 打的是 examples 参考页（假绿）

**现象**：探针 10/10 全绿，但页面是脚手架的 `examples/disease-primer.html`，
本仓原型 primer 是否真实现完全没被测到（无 #disease-primer、无 DP 模块也绿）。
用户在任务里实指过一次的坑，模板化成本条。
**出处**：2026-11-07 MDS 工作台首夜（用户预警 + scripts/probe-disease-primer.mjs L91 默认值）。
**修法**：验收命令固定写 `--url http://127.0.0.1:<port>/prototypes/v0.2/index.html`；
check-probe-coverage 可追加断言：探针文件里必须出现 `prototypes/v0.2` 字样。

### 待实施⑨（下轮进检查器，来自 MDS 首夜）

- check-host-contract 上收「裸布尔直注 + 尾分号 trim」规则（mds-workbench 副本已验证）。
- check-probe-coverage 追加：全量探针文件必须包含 `prototypes/v0.2` 路径字样（防探针打空气）。
- `check-primer-links` 现只查 prototypes/*/primer-data.js；M5 后应同时查 `public/primer-data.js`
  与原型逐字符（ui-parity 已测，双保险可并入）。

### L76 · 陈旧端口服务别的仓副本（探针绿在别人的页面上）

**现象**：egid 夜班对 8151 端口跑 primer 探针 10/10「全绿」，随后发现 8151 是上一夜遗留的
http-server，服务的是 pericarditis 装机副本——绿的是别人的页面。同夜还叠加 L75（默认 URL 打 examples）。
**出处**：2026-11-08 egid-workbench 首夜。
**修法**：①起服务的命令与探针 --url 必须同一条 shell 里写死同一端口；②探针已加身份防呆
banner（无 --url 打参考页时醒目提醒，probe-disease-primer/probe-page-view 两处）；
③汇报「探针通过」必须带实际 --url，机审不了的写明目标 URL；④长期解法（待实施）：
探针启动时输出 `TARGET: <url>` 并在报告汇总行回显，防复制粘贴错行。

### L77 · 私密过滤函数返回类型分叉 = P0 泄露温床

**现象**：filterPrivate 带 `withNote` 时返回字符串、不带时返回对象。看板「最近一条」直接取
`slice(-1)[0]` 不走过滤 → 「改为私密」后回看板即泄露私密正文（短肠综合征首夜独立评审 P0-1）。
**出处**：2026-11-08 short-bowel-workbench 首夜（评审 docs/PROTOTYPE-REVIEW.md P0-1）。
**修法**：三出口过滤函数签名固定返回 `{kept, note}`，禁止按调用点分叉返回类型；
回归断言：「看板 textContent 不得含私密记录正文子串」进探针（short-bowel probe Q35-看板私密）。

### L78 · public/ 不是覆盖目标：从原型直拷 app.js 会炸掉整条开发版链路

**现象**：M5 移植完成后，主线把 prototypes/v0.2/app.js 直接 cp 到 public/app.js「同步版本号」，
结果 apiBase 契约、agent-draft postMessage、MinerU 六部件全部消失，8 个用例红。
**出处**：2026-11-08 short-bowel-workbench 首夜。
**修法**：public/app.js 的全部差异必须住在 `DEV-BRIDGE-BEGIN/END` 注释对里（ui-parity 测试
逐字节保护其余 6 文件）；同步原型改动用补丁不是覆盖。ui-parity 测试本身就是这个坑的检查器。

### L79 · primer 唯一源放 demo-data 里过不了审计

**现象**：primer-data.js 委托 `window.DEMO.primer` 单行；audit 要求四段 id
（definition/evidence/landscape/trend）可静态解析 → 1 失败 + 1 待人工。
**出处**：2026-11-08 short-bowel-workbench 首夜。
**修法**：疾病概要内容唯一源直接放 primer-data.js（自持四段 + landscape 用 points 数组
承载固定出口句）；demo-data 不复制。模板已回写 starter（见 templates/primer-data 模式）。

### L80 · 升版必须一次走完十处同源，半途状态会连环红

**现象**：VERSION 单独 bump 到 0.2.1 → check-version-literal 4 处红、audit version/pkg 红。
**出处**：2026-11-08 short-bowel-workbench 首夜。
**修法**：升版固定顺序：VERSION → npm run build:version → npm run build:client →
public/index.html 与原型 index.html（两份逐字）→ public/app.js 回退值 → 原型 APP_INFO/demo
标签 → README 徽章 → CHANGELOG → 截图改名重拍 → check-version-literal 收口。

### L81 · 「?」按钮在 ≠ DP 模块在：家族探针合同必须逐字对齐

**现象**：原型顶栏有 `data-primer-open`、点击也能开一个自造的 `.primer-overlay` 面板——但家族
探针 probe-disease-primer.mjs 的合同是 `.dp-overlay#disease-primer` + `.dp-panel` +
`.dp-section[data-dp-section]` + `[data-dp="back"]`/`[data-dp="close"]` + `[hidden]` 语义 +
window.DISEASE_PRIMER 的 brand/name/sections[{id,title,intro,points,groups,table,sources}]。
自造面板打家族探针 = 9/10 全挂 P1–P9。此前家族两夜「探针跑的是 examples 参考页不是原型」
掩盖了这类合同漂移（L75/L76）。
**出处**：2026-11-08 short-bowel-workbench（用户晨审点名复核「首页病情介绍与 ? 号」）。
**修法**：①原型直接复制 starter `assets/patterns/disease-primer.{js,css}` 为 primer.js/primer.css，
不自己实现浮层；②primer-data 按 DP 数据合同重写（sources 带 https 深链，禁域名首页——
L1/L3 会拦 clinicaltrials.gov/ 这种裸域名）；③验收必须「双探针」：仓内探针（断言面板真开、
四段非空）+ 家族探针 `--url http://127.0.0.1:<port>/prototypes/v0.2/index.html` 显式指本仓，
汇报必须带实际 URL；④短肠仓探针新增 L81-DP模块挂载 断言（DOM 级 .dp-overlay#disease-primer
+ 数据四段 id 逐字），回归 `scripts/probe-prototype.mjs`。

### L70 · 脚手架生成的探针覆盖检查器把全量探针名写死成上一仓的名字（`probe-aml-m2.mjs`）

- **来源**：2026-11-08 夜班 thymic-workbench（胸腺癌小橡宝）首夜，M2 起跑 `check-probe-coverage` 直接红：`全量探针 scripts/probe-aml-m2.mjs 不存在`。
- **现场**：starter 生成的 `scripts/check-probe-coverage.mjs` 里 `ALL_ROUTE_PROBES = ['scripts/probe-aml-m2.mjs']` 是模板残名；新病种仓必须 ①改成本仓名 ②真的写这份探针。删掉检查器"让它别响"等于把孤儿页保护拆了。
- **修法**：探针默认目标=**本仓原型**（`prototypes/v0.2/index.html`，不得回退 starter examples——L81 同款教训）；探针内嵌 `COVERED` 叶子清单并与 app.js `ROUTES` 逐项比对（新增路由漏改探针 → R0 直接红）；`--self-test` 注入空页证明探针能 FAIL。参照实现：thymic `scripts/probe-thymic-m2.mjs`（35 叶子 15 断言 + self-test 反向）。

### L71 · 构建注入布尔参数带引号会骗过宿主合同检查（`'__X__' === 'true'`）

- **来源**：2026-11-08 夜班 thymic-workbench M5，`check-host-contract` 报 `customFrame 不是 true/false 字面量：'true' === 'true'`。
- **现场**：`build-client.mjs` 用 `String(...)` 注入 + 模板写 `const CUSTOM_FRAME = '__CUSTOM_FRAME__' === 'true'`，运行时语义没错，但**检查器读的是源码字面量**——字符串比较表达式在它的判据里不是 boolean。
- **修法**：布尔占位符直注布尔字面量：占位符表 `__CUSTOM_FRAME__: PANEL.customFrame === true`，模板 `const CUSTOM_FRAME = __CUSTOM_FRAME__`。判据类检查器看源码不跑运行时，生成物必须让"看"与"跑"同真。

### L72 · 临床库四件套必须按 `check-trial-snapshot` 的家族合同出，别自造 manifest 形状

- **来源**：2026-11-08 夜班 thymic-workbench M4，自造 manifest 两轮返工后才对齐。
- **现场**：家族快照合同是：manifest={files:{<jsonl/sqlite>:sha256+bytes}, recordCount, dbCount, sourceStatusRows}；JSONL 行键 recordId/mergedSources/sponsor(键名单数)/registryNumbers/dates…；SQLite 表名 `trials`（列 merged_sources/sponsors/registry_numbers/dates…）+ `source_statuses(query,source_id,state)`。
- **修法**：新仓 fetch 脚本第一步先 `sed -n '8,15p' scripts/check-trial-snapshot.mjs` 抄字段表；jsonl↔sqlite 逐字段深度相等由检查器兜底。参照实现：thymic `scripts/fetch-thymic-trials-2026.mjs`（53 条 CT.gov，PASS）。

### L73 · 夜间 `/claim` 机器人可能不在线：限时等待→按权限自查补标签→留痕待追认

- **来源**：2026-11-08 夜班 thymic-workbench 领取 issue#50，评论 /claim 后 2 分钟无回执（对照同夜其他 issue 亦无）。
- **修法**：等待上限 2 分钟→有 admin 权限则自查补 `claim,claimed` 标签→在 DEV-PLAN 与晨审报告记录时间、原因、补标签动作，表述为"自查补签（待追认）"，不写"维护者已确认"。白天有人在时仍以机器人回执为准。

### L74 · 整页视图焦点回归三件套：显式触发元素 + 多轮补焦 + 探针先滚到再点

- **来源**：2026-11-09 夜班 cold-agglutinin-workbench M2，probe-page-view A4b 两轮假红。
- **现场**：①macOS/无头 Chrome 鼠标点击不聚焦按钮 → `pvState.trigger = document.activeElement` 捕到 body，关闭后「焦点回触发元素」必失败；②mini 图按钮在首屏折叠线下（y>视口高），探针 `mouse.click` 点在空处，`waitForSelector` 传了 `.catch` 静默吞掉，后续断言全在测空气；③Chrome 的 history 导航焦点恢复时点不定（实测 >60ms），单次补焦竞态。
- **修法**：①`openPvLayer(title, html, isDeep, triggerEl)` 显式收触发元素，`closest('button,[role=button],a,input,select,textarea')` 兜底；②`applyPvClose` 补焦改 `[60,200,500,1000].forEach` 多轮重试（判据 `activeElement===body` 才补）；③探针 A4b 先 `scrollIntoView` + `waitForFunction` 等按钮入视口再量坐标点，检查焦点用 `waitForFunction` 轮询落定而非 t=0 抢跑。判据类断言等"落定"不等"时刻"。

### L75 · migrate-public 的版本基准段是第二处版本真源：原型改日期必须两处同改

- **来源**：2026-11-09 夜班 cold-agglutinin-workbench M5，ui-parity 测试「原型缺基准段」红。
- **现场**：`migrate-public.mjs` 的 `FOOT_OLD/APPINFO_OLD` 等常量写死原型当前版本字面量；原型 `index.html` 页脚 build 日期与 `app.js` APP_INFO 不同步时，migrate 生成物与 ui-parity 基准两头红。
- **修法**：版本构建日期改动时同步三处：`prototypes/v0.2/index.html` 页脚、`app.js APP_INFO`、`migrate-public.mjs` 的 `*_OLD` 常量（+ui-parity 测试基准段）。能断言的写进 ui-parity：它已经在断言「原型含基准段」，别删断言，改齐事实。

### L76 · 裁剪试验线也要实跑一次 M4 采集：快照量级是裁剪理由的唯一证据

- **来源**：2026-11-09 夜班 cold-agglutinin-workbench M4。
- **现场**：罕见病种（CAD）候选池小，试验线按 35 号裁剪；若只写「池小」不实跑，裁剪理由不可核验，也不满足「未查或服务失败不能写零结果」。
- **修法**：照常跑 fetch 脚本（四在线通道终态如实入库），在 research/<slug>/README 写「与试验线关系」一节：43 条量级 → 支持裁剪、快照留存备未来版本启用 35 号链路；设置·临床数据库 tab 与 DEV-REQUIREMENTS §三 同口径声明。若实跑结果量级大，改为保留试验线而不是硬裁。

### L82 · 工作台内新建 AI 会话：`newSession(workspaceId)` 才是当前宿主合同，`ensureSession({})` 会「点了没反应」

- **来源**：2026-11-10 小暖宝（cold-agglutinin-workbench）用户点名复核；0.2.1 修复。
- **现场**：customFrame 下宿主即使没有会话也会传一个 `display:none` 的 `conversation` 容器，用 `Boolean(conversation)` 判「已有会话」必然误判；没有会话时又调 `ensureSession({})`，宿主 `ensureSession` 要求 `folder` 为非空字符串，空参数直接 reject——按钮点了既没面板也没报错。2026-11-10 读 io.dsh.desktop 工作台服务源码确认：工作台内创建会话走 `newSession(workspaceId)`；`workspaceId` 缺省时取 `defaultWorkspace()?.workspaceId`，仍没有则走 `newWorkspaceSession → pickDirectory`，用户取消返回 `undefined`，宿主不留目录/工作区/会话/绑定。
- **修法**：①判会话归属仍用 `currentSession()` + `ownsSession()` + `subscribe` 重渲染（L40 既有口径）；②创建走 `service.newSession(service.defaultWorkspace?.()?.workspaceId)`，显式传入；③返回假值 = 用户取消，提示「没有创建会话，可再点重试」，失败在 `note` 写原因；④`creatingRef` 防快速连点/iframe 连发造成双会话；⑤草稿仍只 `setDraft` 不 `submit`。
- **可断言化**：starter `scripts/check-agent-pane-contract.mjs`（rc.29 引入，L82 修正）静态判 7 条：禁 `Boolean(conversation)`、禁 `ensureSession({})`、必须有 `newSession(`/`defaultWorkspace`/订阅钩子/agent-draft 桥、生成物无未替换占位符。占位符判据按「先收集已声明标识符再查剩余」实现——直接搜 `__[A-Z]+__` 会把构建器正常生成的 `const __VERSION__ = ...` 判红（本轮实测假阳性）。
- **仍未自动覆盖**：面板是否真的出现、取消目录后是否留空会话、失败提示是否可见，必须装机后人工走查（V3）；静态检查器只挡反模式，不冒充 UI 验收。

### L83 · 首页第二个「疾病概要」入口关闭后丢焦点：动态节点必须带稳定标识 + 多轮补焦

- **来源**：2026-11-10 cold-agglutinin-workbench P1b 探针首跑失败（secondOpened=true，secondFocusBack=false）。
- **现场**：顶栏 `?` 在 `#main` 外，关闭后 focus 正常；首页文字入口在 `#main` 内，primer 关闭走 `history.back() → hashchange → app.render()`，旧按钮节点被替换，primer.js 对已脱离 DOM 的 `state.trigger` 调 `focus()` 等于没调，焦点掉回 body。
- **修法**：①每个入口加稳定 `data-primer-entry`（顶栏 `top` / 首页 `home`）；②primer.js 关闭时按 key 重定位（旧节点在 DOM 就用旧节点，否则 `querySelector('[data-primer-open][data-primer-entry="…"]')`），并做 `[0,60,200,500]ms` 多轮补焦；③只在 `activeElement` 仍是 body 时接管，避免抢走用户新点的位置；④探针 P1b 必须验「可见入口 ≥2 + 第二个能开四段 + Esc 后焦点回该入口」，不能只验顶栏 P1。
- **可断言化**：cold-agglutinin `scripts/probe-cold-agglutinin-m2.mjs` P1b（双形态 35/35）；starter `assets/patterns/disease-primer.js` 已带重定位实现，`docs/36-DISEASE-PRIMER.md` §4.1b 写明合同。

### L84 · Desktop 真实装机 profile 是 harness/profiles/web,不是 ~/.dsh/profiles/desktop

- **来源**:2026-11-11 bone-cancer-workbench 0.2.0 M6 装机实测(verify-desktop-load.mjs 头部注释 L14)。
- **现场**:本机有两个「profile」——`~/.dsh/profiles/desktop` 属 DeepSeek Harness.app(0 个工作台),真实 DSH Desktop(io.dsh.desktop)加载的是 `~/Library/Application Support/dsh-desktop/harness/profiles/web`(50+ 兄弟工作台,file: tgz 形态依赖 + dsh.profile.bundles 登记)。装错前者后 verify-desktop-load 报「装机目录:未安装」,重启十次也不会加载。
- **判据**:先看目标 profile 的 package.json dependencies 里有没有 `@xyb-community/*` 的 file: 条目;没有的就是错的对象。verify-desktop-load.mjs 的「宿主工作台清单」一行是权威信号。
- **附带坑**:对含 github tarball 依赖的 profile 直接 `pnpm add <tgz>` 会 ERR_PNPM_TARBALL_INTEGRITY(codeload 的 gz 字节不稳定,与你的包无关)。现行可行路径:解包进 `node_modules/@xyb-community/<pkg>/` + package.json 写 `file:<本仓>/release/<tgz>` + bundles 追加,不重写 pnpm-lock(代价:下次全量 `pnpm install` 会剪掉,需重跑本路径)。
- **可断言化**:待实施——probe-profile-target.mjs 断言「目标 profile deps 含 ≥1 个 @xyb-community file: 条目,且 bundles 含本包」;verify-desktop-load 已断言「宿主工作台清单含本包」。

### L84 · 整页视图 A4b 是竞态不是缺陷：探针要等「焦点已回位」事件，不要等固定毫秒

- **来源**：2026-11-11 pemphigus-workbench probe-page-view 首跑 A4b 失败（pericarditis 同代码同天通过）。
- **现场**：app.js 关闭整页视图后有 60ms 补偿定时器做焦点回位（hashchange 重渲染会顶掉第一次 focus）。探针在 `overlay hidden` 后立刻读 activeElement，实测 +50ms 还是 BODY、+120ms 已回位——跟定时器赛跑，结果随机器快慢漂。
- **修法**：探针加 `waitForFunction(() => document.activeElement?.dataset?.open === 'chart', { timeout: 1000 })` 等「焦点已回位」这个真实事件就绪（家族纪律「测试等实际加载与事件就绪」的又一实例）。修的是探针时机，不是 app.js 行为。

### L85 · Desktop profile 的 file: 依赖会随姊妹仓清理而失效：装机前先盘 stale tgz，修复走「同版本重打包」

- **来源**：2026-11-11 pemphigus M6 装机：profiles/web/package.json 51 个 file: 依赖中 24 个指向已被清理/升版的姊妹仓 release/*.tgz，pnpm add 对**未改动的依赖**也重解析 → ENOENT 整次安装失败。
- **修法**：①装机前脚本盘一遍 file: 引用的存在性；②失效项从 Desktop node_modules 已装副本 `npm pack` 出**同版本** tgz（放到本仓 release/rebuilt/，不写姊妹仓），再把 profile 依赖路径改指新位置——零版本升级副作用，Desktop 当前行为不变；③装完跑 check-install.mjs 复核登记。
- **教训**：profile 是机器本机状态，修复它属于装机恢复操作，不是业务变更；但要在签认表里如实记录动了哪些路径。

### L86 · init 生成的检查链是 M0 精简版：probe 探针名硬编码 aml + 缺 M5 脚本，第一晚必踩两坑

- **来源**：2026-11-11 pemphigus M2/M5：check-probe-coverage 硬编码 `probe-aml-m2.mjs` 直接红；check 链缺 build:public/check-ui-parity/check-wording/check-schema-words 等，需从上一仓手工搬 7 个脚本。
- **修法（已回流进 starter）**：①project-template/scripts/check-probe-coverage.mjs 改为按目标仓 slug 自动探测 `probe-<slug>-m2.mjs`（读 package.json name 去 -workbench），回退 aml，两者皆缺报红并给应建文件名；②init.mjs 计划补发 7 个脚本（check-schema-words/check-wording/check-ui-parity/check-public-tokens/migrate-public/build-client/build-version）并把 M0 安全项（schema-words、wording）接入检查链，build 系脚本随包待 M5 使用；③test 脚本统一加 `--disable-warning=ExperimentalWarning --test-concurrency=1`。

### L87 · 静态契约检查器会被「误插的 subscribe」骗过：光有字样不算订阅，要验它落在 Panel 里且在 return 之前

- **来源**：2026-11-11 全家族 AI 面板收敛（第二/三轮）。prostate-workbench 上一轮所谓「已加会话订阅」实际是把三行 subscribe 塞进了 `PrimerPanel` 的 `useEffect`，而且插在 `return () => {...}` **之后**——那段代码永远不执行，还因为引用了未声明的 `setPaneTick`/`setNote` 把 primer 的 pushState/popstate/焦点回收/滚动恢复一起变成死代码。检查器只查「文件里有没有 subscribe 字样」，于是判绿；实机表现是 primer 整页视图深链全坏。
- **同批第二个假绿**：ovarian / lung 的 CHANGELOG 写着「订阅会话变化触发重渲染」，代码里 subscribe 计数为 0；四条里三条根本没有订阅，一条是有害误插。**写着改过不等于改过，字符串出现在源码里不等于被执行。**
- **修法（已回流进 starter 的 check-agent-pane-contract）**：①订阅断言要求 `subscribe` 出现在 Panel 组件体内、且排除掉 `return` 之后的行（简写法：取 Panel 起止区间再判，找不到区间就报红）；②`agent-draft 只填不发` 要求判 `send` 是否被真正传给宿主通道，不看注释；③任何「已修复」的 CHANGELOG 条目必须附 grep 数字（`subscribe=1 ensureSessionCall=0 BooleanConv=0`），复跑检查器 `--self-test` 仍须能红。
- **教训**：检查器越容易满足，越容易变成装饰。反模式检查器的每条断言都要问一遍「怎么用一行无害文本骗过它」，能骗过就加结构条件。

### L88 · 业务界面不一定叫 `public/`：判"装了空白"前先看 `dsh/index.js` 服务的是哪个目录

- **来源**：2026-11-11 装机层全量核验脚本首版，把 `fshd-workbench 0.1.6` 判成「包里没有业务界面」。用户当时正在看这台工作台，界面好好的。
- **现场**：fshd 的 `dsh/index.js` 写的是 `const UI_DIR = join(..., '..', 'assets', 'ui')`，界面在 `assets/ui/{index.html,app.js,primer*}`，包里也确实带着——只是不在 `public/`。同批还有 ovarian(347KB)/lung(864KB) 把界面**内联在 `lib/client.js`**，也没有 `public/`。
- **修法**：判据从「有没有 public 目录」改成「有没有能打开的业务页」，认三种形态：`public/index.html`、任意被服务的静态目录（包内两层内找 `index.html`，跳过 docs/examples/prototypes 等）、内联视图（client.js 体积过百 KB）。检查器同时把「界面在哪」打印出来，人能一眼复核。
- **教训**：目录名是最脆弱的判据。三个仓三种放法，说明"家族约定"只覆盖了多数派；闸门一旦写死路径，少数派会被误判成缺陷，而误判比漏判更贵——它会让人去"修"一个没坏的东西。

### L89 · 模板里的「上一病种」字面量会被 init 原样带进新仓：build-client 模块 id、migrate-public 日志 tag
- 现场（2026-11-12 acquired-hemophilia-workbench）：init 后 `scripts/build-client.mjs` 里 `id: "@xyb-community/pemphigus-workbench"`——新仓打包产物以别人的 id 注册；`migrate-public.mjs` 日志 tag 也是 [pemphigus]。
- 修复：模板不再写死 id（从 package.json 派生）；日志 tag 去病种化；check-derivative-leftovers 词表累积 + 自病种排除（命中词是本仓 name/slug 子串时忽略，否则词表每加一组、对应仓自己必红）。
- 判据：`node scripts/build-client.mjs && grep -c "pemphigus" lib/client.js` = 0。

### L90 · init 骨架与自家检查链不自洽：新仓第一天基线必红（已回流修复）

- **来源**：2026-11-12 cidp-workbench 夜班 M0：dsh-wb-cli rc.37 init 出的 `lib/client.js`（42 行骨架）没有原生 AI 面板会话接线，而 rc.37 把 `check-agent-pane-contract`（要求 newSession/defaultWorkspace/订阅/草稿桥）接进了 init 的 check 链——新仓基线 `npm run check` 必红，M0「基线绿」闸口无法过。
- **修法（已回流进 starter，rc.39）**：`project-template/lib/client.js.tpl` 从 42 行骨架扩为约 320 行**带真实接线**的原生面板骨架（ownedSession 归属判定 / `service.newSession(defaultWorkspace?.()?.workspaceId)` / 订阅触发重渲 / 草稿只填不发 / 取消与失败提示 / 25–45% 可拖 splitter / `primary-immunodeficiency:agent-draft` 桥），模板化自 cidp-workbench 骨架实现（其静态 7/7+双形态实测）。
- **判据**：fresh init 后 `npm run check` exit 0（夜班实测 /tmp 冒烟仓通过）；检查器 10 条断言里「禁止 Boolean(conversation)」连**注释里的字面量**都会抓——模板注释措辞要用「conversation prop 的真值判断」绕开词面。
- **教训**：给检查链加新断言时，必须同步验「init 的产物能不能过自己的链」——门禁的起点是自家模板。

### L91 · 定点移植的 OLD 常量会静默失配：replace 不命中不报错，ui-parity 双假绿

- **来源**：2026-11-12 cidp-workbench M5 移植：`migrate-public.mjs` 的 `TITLE_OLD` 是上游 pemphigus 时代字面量（「小愈宝 HealPal · 天疱疮工作台」），对本仓原型 `.replace()` **静默 no-op** → public/index.html 保留原型标题；ui-parity 测试因 `expected()` 走同一个 no-op replace 而两侧相等——**两道闸门同时假绿**。同批发现 `APPINFO_OLD` 引号形态（单引号 vs 原型双引号）也不匹配。
- **修法（建议，cidp 已手改常量；模板化待下一轮）**：migrate-public 的每个 OLD 常量在 build 时断言「替换真的发生」——`if (!src.includes(OLD)) problems.push(...)`；替换后 `assert(!out.includes(OLD))`。ui-parity 的 revert 链同理：把 revert 结果与原型 diff，若 revert 没还原出原型原文立即红。
- **教训**：靠 `.replace()` 的定点移植，任何 OLD 写错都是**静默失配**；「expected() 与产物相等」这种自洽断言只证明「没改过字符」，不证明「该改的改了」。凡 replace 类契约，必须有「命中数 = 预期数」断言。

### L92 · perl 单行改码时 `@` 要转义：`s/"@xyb\//...` 会把 @xyb 当数组插值静默吞掉

- **来源**：2026-11-12 cidp-workbench M5：`perl -pi -e 's/id: "@xyb-community\/pemphigus-workbench"/...'` 里 `@xyb` 被 perl 当数组插值（空），pattern 实际变成 `id: "-community/..."`，**匹配不到也不报错**，命令「成功」但没改任何东西。
- **修法**：写 `s/"\@xyb.../` 转义，或改用 python/node 脚本改码；改完必须 grep 验证目标串已变，不靠命令退出码。
- **教训**：单行改码工具的静默失配与 L91 同类——「命令成功」不等于「改动落地」。

### L93 · 「配置目录」做成说明弹窗也能全绿：两个仓同天翻车，说明这不是偶发

- **来源**：2026-11-12 两个新开发仓（acquired-hemophilia / cidp）同一天同一处失手——顶栏「配置目录」点开只有一段话，正文自己写着「本原型为示意，目录未真实挂载」。
- **为什么既有检查抓不到**：语法过、包清单过、面板契约过、文案红线过。它不报错、也不违反任何字符串规则——它只是**不做**。所有"查字符串"的闸门对"假入口"天然失明。
- **修法**：新增 `templates/check-data-dir.mjs` 并随 init 下发、入 `npm run check`。四条判据：①有真实选择动作（`pickDirectory`/`showDirectoryPicker`/`webkitdirectory` 至少一个）②拒绝清单命中 ≥3（主目录/桌面/下载根/tmp）且有判定函数 ③patch 有 `config.root: dshHomePath(...)` 且 dsh 读 `config.root` ④「未真实挂载」这句存在但没有任何选择动作 → 直接红。`--self-test` 内置反例（说明弹窗）必须能红。
- **教训**：**"写了这句提示"不等于"实现了那个功能"**。凡是界面上的入口，闸门要判"动作存在"，不能判"文案存在"。

### L94 · 用推断裁掉整条功能线：两个仓都说「候选池个位数」，实测 30 条，而且包里本来就躺着快照

- **来源**：2026-11-12 同上两仓。裁剪理由三条：候选池个位数、召回不可靠、字段不对齐；前端只剩「裁剪说明页」，后端 `trialMatch` 却还在，包内 `research/*/*_trials_2026.{sqlite,jsonl}` 也在。
- **代价**：用户看到的是"这病没有临床试验线"，实际有 30 条可检索（多数登记研究、非干预试验）；而且"数据在、入口是假的"比"没数据"更糟——它让后续开发以为没东西可做。
- **修法**：新增 `templates/check-trial-chain.mjs` 入链。判据：有快照或有 `trialMatch` → 前端必须四段齐（建档/检索/匹配/呈现收藏），有数据但只有裁剪说明页直接红；无数据无后端 → 裁剪理由必须带实测 N 条 + 快照口径，纯推断词（个位数/极少/不可靠）直接红。
- **教训**：**裁剪也是要被审计的决定**。"我们评估过所以不做"必须附实测证据与日期，否则就是拿推断换工期。


### L95 · 「只能看 demo」能过所有闸门：用户拿到手没法记录自己的事

- **来源**：2026-11-12 全家族体检（用户点名"这是共性错误，大部分项目只有 demo 数据，无新建入口"）。抽查 4 个仓，`check-patient-create` 全红；全家族只有 7 个仓有某种形式的档案入口。
- **为什么既有闸门抓不到**：两套合成档案让首屏有内容、截图好看、`check`/`audit` 全绿；"能不能新建"既不是字符串规则也不是布局规则，所有检查都对它失明。
- **修法**：新增 `templates/check-patient-create.mjs` 随 init 下发并入链。四判据：①患者/档案级新建入口（"新建一条记录"不算）②`POST /subjects` + `INSERT INTO subjects/profiles` 真写库 ③多档案列表 + 当前档案状态 ④demo 有 `is_demo`/种子标记，新建档案与 demo 并存。`--self-test` 内置"只有 demo"反例。
- **教训**：**"演示能跑"不是可用性判据**。凡是"用户要长期往里写东西"的产品，闸门必须查"新增链路"，而不是查"首屏有内容"。

### L76 · file: tgz 重装时 pnpm 会判「Already up to date」不重解包

**现象**：mds-workbench 0.2.0→0.2.1 重装 profiles/web，`pnpm add -w --save-exact file:…tgz`
输出 Already up to date、added 0——package.json 钉到了新 tgz，但 node_modules 里的解包内容
还是 0.2.0 的旧文件（grep 新代码特征 = 0）。判定法被"看起来装了"骗过。
**出处**：2026-11-12 MDS 工作台试验线真实可用改造（用户指正后重装机实测）。
**修法**：重装先 `rm -rf node_modules/<pkg>` 再 `pnpm add -w --save-exact --force file:…tgz`；
装完必须 `grep -c <本次新代码特征>` 安装副本（06 号「装机副本 grep 新代码特征」的强制化）。
