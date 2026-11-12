# 临床线 + 多患者写入闭环 · 一次做对开发提示词（可直接粘贴给开发 Agent）

> 用途：新病种工作台在 M4/M5 阶段，**一次把「临床试验线」与「新建患者/多用户写入闭环」做完整**，不要先裁剪、不要只做演示态。
> 出处：acquired-hemophilia-workbench 0.2.0（临床线返工）与 0.3.0（写入闭环返工）两轮实测。两轮都是「先交付了能看的，再被用户点破缺功能」——本提示词就是把这两次返工前置成开工检查。
> 用法：粘贴给开发 Agent 后，先按 §0 自检，再按 §1/§2 顺序实现，最后按 §3 逐条报数。**任何一条写「通过」必须带命令输出或 file:line。**

---

## 0. 开工先自检（10 分钟，缺一项就先补再往下）

| # | 自检 | 一眼验证 | 不合格的后果 |
| --- | --- | --- | --- |
| 0.1 | 仓里已有 `research/<slug>/` 四件套，且 `manifest.recordCount = jsonl 行数 = sqlite trials 行数` | `node scripts/check-trial-snapshot.mjs .` | 临床页只能写「未接入」，等于没做 |
| 0.2 | 已算清「快照里与本病的**相关条数**」，不是只算总条数 | 见 §1.4 判据 | 会把「相关 0」写成「没有研究」，或反之 |
| 0.3 | `dsh/workbench.js` 有写方法（createProfile/addEntry/setPrivacy）且 `server.js` 有 POST 路由 | `curl -X POST /api/profiles` 返回 profileKey | 只能演示，不能建真实患者 |
| 0.4 | 前端所有 save 走 `apiBase() != null` 双通道，而不是只 push 数组 | `grep -n "apiPost('/api/profiles" prototypes/*/app.js` | 刷新即丢，用户第一句就是「不能建患者」 |
| 0.5 | schema 里 `subjects.is_demo` 存在，且新档案写入 `is_demo=0` | `grep -n is_demo schema/*.sql` | demo 与真实数据无法区分，导出/统计会串 |

**红线：不允许先写「本台未接入临床试验」的裁剪声明来交差，除非 §0.1 的快照确实采集失败并在 manifest 里留下 FAILED 证据。**

---

## 1. 临床试验线（35 号四段链路）——一次做全，不许只做一页

### 1.1 数据底座（M4）
1. 写 `scripts/fetch-<slug>-trials-<年>.mjs`，**唯一入口 unified-trial-mcp（MCP stdio）**，禁止自己拼 URL。
2. 四通道实跑（chinadrugtrials / ctv / ictrp / chictr_online）；**每个通道终态原样进 manifest**：`SUCCESS / NO_RESULTS / FAILED / TIMEOUT / NEEDS_SETUP`。
3. `FAILED`/`TIMEOUT` 一律**不算「查过」、不计覆盖率**；界面必须能逐通道展示终态。
4. 产出四件套：`manifest.json`、`trials-<年>.jsonl`、`<slug>_trials_<年>.sqlite`、`README.md`；manifest 记录每通道条数、查询词、snapshotDate、sha256。
5. **相关条数单独算**：按标题/研究对象关键词统计「与本病相关」的条数，写进 manifest 与 `demo-data.snapshotMeta.relevant`。
   - 实测教训：205 条快照里相关 0 条时，界面若只写「已载 205」会让用户误以为有；只写「裁剪」又会被问「是没有还是没实现」。
6. 相关 0 时的**标准写法**（三处同口径，缺一处算未完成）：
   - 临床页卡头：「已载 N 条（含 M 条虚构示例）/ 快照 X 条 · **相关 Y 条** · 相关 0 **不代表「没有研究」**，检索词命中才进池、通道召回有限」
   - 检索页：真实快照抽样 4 条，每条标「✕ 相关」，并注明「完整快照由服务层透传」
   - 设置·临床数据库 tab：逐通道终态 + 同一句「相关 0 ≠ 没有研究」

### 1.2 服务层
7. `Workbench.trialMatch(keyword)`：只做关键词 `LIKE` 过滤 + 登记字段透传，**返回 `honestyNote`（含「未核实」「需人工核对」「快照会过期」）**；`total` 用全表计数（不是过滤后条数）。
8. 路由 `GET <apiPrefix>/trials?keyword=`，失败返回 500 + detail，不裸崩。
9. 演示数据的 `trials` 只放**明示虚构**的 2 条（`fictional: true`、不含可用登记号）；真实快照另放 `realSample`，两者不混。

### 1.3 界面（必须三子页，不许单页塞检索框+结果表）
10. `clinical` 子页 = `match` / `search` / `saved`，一级菜单名「临床研究」。
11. **匹配页**（③）：四段链路提示条 + 建档字段卡 + 候选池口径卡头 + 偏好 chips（只影响排序）+ 匹配卡。
12. **匹配卡四件套**（缺一即失败）：
    - 分数方块 + 小字「登记字段符合度」
    - 固定行「**n / m 项对得上 · k 项待确认**」（只给百分数不给分母 = 失败）
    - 逐条证据链三态（✓/✕/?），**✕ 与 ? 排前**，每条含「记录里是：…（带来源）· 条件要求：…」
    - 「**不是入组资格**」声明
13. **检索页**（②）：关键词 + 研究类型/地区/状态；**按条件排，不掺分数**（页面上不得出现 `%`）；空态给「清空条件重试」。
14. **收藏页**（④）：只存本机 `{trialKey, savedOn, state}`，三态 在跟/准备问/已归档；**快照没有状态时间线就明写「没有」，不画假进度条**；拒收零副作用且可恢复。
15. 匹配纯函数抽成 `prototypes/<ver>/trial-match.js`（可 `new Function` 加载），**函数签名不收靶点**；判据只读快照真实字段（title/studyType）；**可对照项 <2 不给百分数**。

### 1.4 门禁（一次性接进 check 链）
16. `scripts/check-trial-matching.mjs`（starter 模板）进 `npm run check`；`--self-test` 必须能红。
17. `scripts/check-trial-snapshot.mjs` 不许再 `--if-present`（有快照就必须对账）。
18. 新增 probe 断言编号建议 `TR1–TR7`：口径卡头 / 匹配卡分母与分数 / 证据链三态排序 / 不是入组资格 / 纯函数三例 / 收藏零副作用 / 检索无分数。
19. 新增 `test/trial-line.test.mjs`：纯函数三例（相关给分、不相关硬性✕低分、可对照<2 无百分数）+ `Workbench.trialMatch` 的 `total === manifest.recordCount` 与 `honestyNote` 断言。

---

## 2. 新建患者 + 多用户 + 写通 sqlite——一次做全

### 2.1 数据与 API
20. schema 必须已有 `subjects(profile_key, name, meta, action_plan, is_demo, created_on)`；新档案 `is_demo=0`。
21. `dsh/workbench.js` 四个方法（缺一不可）：
    - `createProfile({name, tag, facts})` → `{profileKey}`，`profile_facts` 逐字段落库（空值跳过）
    - `addEntry(profileKey, kind, data)` → 支持 **8 类**：`bleed / lab / treatment / question / hospital / report / doc / mind`
    - `setPrivacy(profileKey, kind, id, private)` → 支持合成 id（`user-xxx-b1`）与 mind 索引（`feel0/family0`）
    - `listProfiles()` → 含 `is_demo` 标记
22. **id 必须能对回 rowid**：新增记录的合成 id 用与读模型 `readmodels.synthId` 同一套规则（前缀、字符、补零宽度），返回 `{id}` 供前端直接使用。
23. `server.js` 三条 POST 路由：`/profiles`、`/profiles/{key}/{kind}`、`/privacy`；body ≤64KB，JSON 解析失败返回 400 可读错误。
24. `dsh/index.js` 与 `scripts/dev-server.mjs` 的 `services` 都要挂 `kinds/createProfile/addEntry/setPrivacy`（宿主与独立启动同一条路径，禁止只改一处）。
25. `capabilities` 加 `write`，`/health` 可自证。

### 2.2 前端双通道
26. 统一两个函数：`apiBase()`（读 `window.__AHA_API_BASE__`，注入令牌）与 `apiPost(path, body)`；**没有 API 时返回 null，走内存分支**。
27. 每个 save 函数（8 类 + 私密切换）都必须是：
    ```
    if (apiBase() != null) { const res = await apiPost(...); if (res?.ok) { await refreshBootstrap(); toast('已保存到本机数据库'); return } }
    // 演示态：内存 push + toast 明说「演示态，刷新重置」
    ```
    失败时**回退并提示**，禁止静默失败。
28. 私密切换用**乐观更新 + 失败回退**（先 render 再写库，写失败 `!next` 还原），否则用户点完看不到变化。
29. 档案卡弹层升级为「档案管理」：demo 与自建同列表（演示/自建 标记）+ 表单（名称/标签/确诊经过 ≤3 字段）+ 创建后自动切换并清空会话与草稿。
30. 空档案不空白：各页保留「＋」入口与空态 CTA；顶部标注档案名，避免用户以为在看 demo。

### 2.3 门禁
31. `test/write-api.test.mjs` 四组断言：共存（demo+自建=3）/ 八类写库与同形回读（APTT 展示键↔库键）/ 私密两种寻址 + 导出过滤 / 错误路径可读。
32. probe 新增 `PR1–PR4`：
    - PR1 档案管理弹层有表单与创建按钮，且文案区分「写库 / 演示态」
    - PR2 创建后 `is_demo=0` 且自动切换、与 demo 共存
    - PR3 写一条记录 → **页面 reload** → 记录仍在、备注逐字一致（持久化）
    - PR4 私密切换 → reload → `is_private` 仍为 true
33. probe 无 API 形态下 PR2–PR4 记 **SKIP（原因：本形态无 API）**，不计通过；不许把它写成 pass。

---

## 3. 报数模板（交付时逐条填，缺项写「未实现」）

```
临床线：快照 X 条 / 相关 Y 条 / 通道终态 [id:state …] / check-trial-snapshot PASS
        check-trial-matching PASS（--self-test N 条反例）/ 纯函数三例 / probe TR1–TR7 N/N
写入链：createProfile ✓ / addEntry 8 类 ✓ / setPrivacy 2 种寻址 ✓ / listProfiles ✓
        test/write-api 4 组 ✓ / probe PR1–PR4 N/N（双形态；无 API 形态 SKIP 已注明）
        reload 持久化：档案 ✓ 记录 ✓ 私密 ✓
门禁：check exit 0 · test A/A · audit B/B · 探针 M/M（URL 写明）
装机：tgz sha256 … / profile bundles N / verify-desktop-load 结论 / V3 UI 待人工
```

## 4. 已知反模式（出现即返工）

1. 用「本台未接入临床试验（如实裁剪）」代替实现——除非 manifest 有 FAILED 证据。
2. 匹配卡只给百分数不给分母；检索页出现分数；把「相关 0」写成「没有研究」。
3. 新档案只 push 到内存数组，刷新即丢；或只改 `dev-server` 不改 `index.js`（装机后写入全挂）。
4. 新增记录 id 自己造一套，与读模型合成 id 对不上 → 私密切换/详情页找不到行。
5. demo 与真实档案共用列表但无 `is_demo` 标记 → 导出、统计、切档串数据。
6. 私密切换只改前端不落库，或落库失败不回退 → 用户点了没反应/以为已私密。
7. 把「演示态」写成「已保存」——必须逐字区分「已保存到本机数据库」与「演示态，刷新重置」。
