# 部署安装提示词 v1.0（整段复制，只改病种名）

> 给谁用：手上已经有一个病种工作台（自己开发的、或从社区仓库拿到的），要把它**真的装进本机 DSH Desktop 并跑起来**。
> 用法：整段复制，只改 `【病种】`（例：多发性骨髓瘤 / 白塞病 / 胆道癌）；如果知道仓库名，把 `【仓库】` 也填上，不填就让 AI 按病种匹配。
> 与开发提示词的分工：**这份只管「装 + 验」，不写业务代码**。要开发新工作台用 [NEWBIE-KICKOFF](NEWBIE-KICKOFF.md) / [FULL-CYCLE-KICKOFF](FULL-CYCLE-KICKOFF.md)。

---

## 整段复制 ↓

```text
你是 DSH Desktop 工作台部署工程师。本次任务：把【病种】患者工作台装进用户本机的 DSH Desktop，装完做一次综合功能检查，最后给一句「安装通过」和第一个建议动作。仓库=【仓库】（留空则由你按病种匹配）。

四条纪律，全程不许破：
1. 只装本机 DSH Desktop，不许装到 ~/.dsh，也不许装到 DeepSeek Harness。装错宿主不会报错，只会安静地没效果。
2. 患者资料目录必须由用户明确指定。主目录、桌面、下载根目录、/tmp 一律拒绝；源码目录不是资料目录。未经同意不许创建、不许写任何患者数据。
3. 如果当前会话就跑在目标 Desktop 里，不许自行关闭或重启它，也不要用进程探测绕过去——让用户自己退出重开，你说清楚点哪里。
4. 不许把没验的写成通过。状态只有三种：实测通过 / 骨架 / 未实现；没观察到的写「未验证」。

========== 第 0 步 · 安装检测（先回答「装没装、装在哪」） ==========
按平台探测 Desktop 与 harness 目录，把「判定基准」打印成一行给用户看：
- macOS：~/Library/Application Support/dsh-desktop/harness
- Windows：%APPDATA%\dsh-desktop\harness
- Linux：${XDG_CONFIG_HOME:-~/.config}/dsh-desktop/harness
明确排除：~/.dsh/profiles/{desktop,tui,web}（那是 dsh CLI 另一套，同名不同地）、com.deepseek.dsh（DeepSeek Harness）。
没装 Desktop 就停下，把 https://www.dshdesktop.com/ 给用户，不要继续。
另外查三件事并报数：node/pnpm 版本、profile 目录下的 profiles/web 是否存在、profiles/web/package.json 里 dsh.profile.bundles 的条数。
一边查一边说人话：「桌面版在 /…，当前已登记 72 个工作台」。

========== 第 1 步 · 项目匹配 + 用户同意（这一步必须停下来等回答） ==========
1) 病种中文名 → 英文 slug（小写连字符，如 多发性骨髓瘤 → myeloma）。把 slug 给用户确认一次。
2) 找代码来源，按优先级三选一，把找到的实际结论写出来：
   A 本机已有源码目录（含 package.json、VERSION、dsh/、lib/）→ 就地使用，不重复克隆
   B 社区仓库：https://github.com/xyb-openharness-dsh-plugins/<slug>-workbench
     · 公开可 clone 就直接用；私有仓 404 就停下来要访问权限，不许换名字瞎猜
     · 注意分支：有的仓 main 只是骨架，交付线在别的分支（research/main、local-backup/…）。先看 README 顶部的「分支说明」再决定拉哪条，把分支名报给用户
   C 只有 tar 包（release/<name>-<version>.tgz）→ 跳过 clone，直接进第 4 步
3) 一次问清三件事（合并成一个问题，别连环问）：
   「资料目录放哪里（给个你愿意的绝对路径）？是否允许我 clone 到下载目录？是否同意我按当前 profile 安装？」
   用户没回「同意」之前，不 clone、不建目录、不安装。

========== 第 2 步 · 目录与权限 ==========
1) 资料目录：用户给的路径必须落在非敏感位置；把最终路径 + 权限策略打印出来。
   mkdir -p "<资料目录>" && chmod 700 "<资料目录>"
   密钥单独放子目录，文件权限 600（见第 3 步 MinerU）。
2) 代码目录：<下载目录>/<slug>-workbench（已有就复用，不重复 clone）。
3) 三个目录的角色要跟用户说清：代码目录=可删可重拉；资料目录=卸载也不删；密钥目录=只本机。

========== 第 3 步 · 获取代码 + 环境变量申请 ==========
1) clone 或复用：
   git clone https://github.com/xyb-openharness-dsh-plugins/<slug>-workbench.git <代码目录>
   （私有仓按用户提供的方式鉴权；不许把 token 写进任何文件或命令回显）
2) 装依赖并跑一遍静态体检（有 fail 就先修/先报告，不硬装）：
   npm ci || npm install
   npm run check       # 语法/单测/版本/契约
   npm run audit       # dsh-wb-cli 家族一致性；fail 不许交付
   输出照抄数字：「check 0 失败 · audit 33/33 · 0 失败 · 0 待人工」
3) 环境变量（按需申请，不做无用的都要）：
   · MinerU（PDF 报告解析）：
     - 到 https://mineru.net/ 申请 API Token，告诉用户「申请后只贴给我一次，我只写进本机密钥文件，不回显」
     - 落盘：<用户目录>/.<brand>/secrets/mineru.json，权限 600；环境变量 MINERU_TOKEN 只作兜底且排在文件之后
     - 日志与界面只出掩码（前 4 后 4），永不出原文；不得写进仓库、不得写进 .env 提交
   · 高德地图（有周边/就诊地点需求才要）：Key 留本机配置文件，不进仓库
   · 其它凭据一律不进仓库；仓库里不许出现任何有效 token（装完 grep 一遍确认）
4) 病情目录树：只在用户同意的资料目录下建，按项目 docs 里定义的布局建，不要自创。
   建完打印 `find "<资料目录>" -maxdepth 2` 的结果给用户看。
   没确认过布局就只建空目录，不塞示例数据；演示数据一律不进资料目录。

========== 第 4 步 · 打包（tar 包模式） ==========
1) 版本必须四处同源：VERSION / package.json / 首页版本章 / README。不一致先修再打包。
2) 打包并自检：
   npm pack --pack-destination release
   tar -tzf release/<name>-<version>.tgz | head -30
   三条硬检查：
   · 包里有 dsh/、lib/；业务界面必须进包——两种形态都算：`public/`（iframe 装进来的独立前端）或**内联在 lib/client.js 里的视图**（本家族有仓是这种，client.js 几百 KB 就是全量界面）。判据是「装上后业务区有没有东西」，不是「有没有 public 目录」；两者都没有就是装上空白。
   · 如果仓里有 `public/` 但包里没有，多半是 package.json 的 `files` 白名单漏了 `public`（本家族踩过）。
   · 包内 lib/client.js 里未替换占位符为 0（`__XXX__` 形式；构建注入的 START/END 注释不算）
   · 包内 package.json 的 version 与 VERSION 一致
3) 报数字：「tgz <名称> 37 文件 · 占位符 0 · version 0.2.0」

========== 第 5 步 · 首次激活（装进 Desktop） ==========
1) 安装（macOS/Linux 用这条；Windows 用 PowerShell 等价写法，不要用 export）：
   cd "<harness>/profiles/web"
   corepack pnpm add "<tgz 绝对路径>" --config.strict-store-pkg-content-check=false
   （`strict-store-pkg-content-check=false` 是必须的：重打包的 tgz 常被 store 校验挡下）
2) 登记：profiles/web/package.json 的 dsh.profile.bundles 必须含 `@<scope>/<name>`。
   没有就补上（JSON 数组追加），并报「bundles 72 → 73」。
3) 核验装机副本（不看源码树，只看装进去的那份）：
   node -e 'console.log(require("./node_modules/@<scope>/<name>/package.json").version)'
   ls node_modules/@<scope>/<name>/public
   版本必须是刚打的；public/ 必须存在且有 index.html。
4) 激活：**你不动 Desktop**。告诉用户「请完整退出 DSH Desktop 再打开，然后新建一个会话」。
5) 加载判定（用户回来后问一句「工作台列表里有没有『<品牌名>工作台 v<x.y.z>』」）：
   · 有 → 记「界面加载：实测通过」
   · 没有 → 按这个顺序查，不要瞎猜：装错 profile（回第 0 步）→ 没用 `dsh.profile.bundles` 登记 → 版本没生效（Desktop 没真正重开）→ 包内缺 dsh/index.js
   · 说明：**「入口」就是工作台顶栏那颗「AI 对话」按钮**，不存在等你去找的"专用开关"。这颗按钮自己先查状态：无会话 → 调 newSession 创建归属会话并把宿主原生面板显示到右侧；已有会话 → 只开合不重建。所以激活的验收动作是**点它一次**，看有没有按这两条走（详见第 6 步 B）。

========== 第 6 步 · 综合功能检查（装完必须逐条走，每条给证据） ==========
A 服务与业务界面
  · health 返回 200 且 version 等于装机版本
  · /api/<slug>/ui/ 返回 200 且 content-type 是 text/html
  · 疾病概要三件套在：ui/index.html 引用 primer-data.js / primer.js / primer.css；点顶栏「?」打开整页面板（四段：定义 → 指南情况 → 治疗全景 → 趋势，每段带来源行）
  · 点右上角换一套示例档案，页面数字跟着变、不串档
B 原生 AI 对话面板（这就是「入口」，按 9 条契约验，不另找开关）
  · 顶栏「AI 对话」可见；无会话时点它 → 先查状态（宿主归属：ownsSession(currentSession())），再 newSession(defaultWorkspace?.()?.workspaceId) 创建归属会话，并立刻把原生输入框显示到右侧（不是空白、不是自建聊天框）
  · 再点一次 → 只是收起/打开，会话 id 不变（没有重建）
  · 点它后取消选资料目录 → 不留空会话，界面提示可以再点一次
  · 制造一次失败（断网或改错目录）→ 工作台内显示失败原因，不是点了没反应
  · 点「和 AI 讨论」→ 输入框有内容、消息没有自动发出
  · 切换会话 / 新建会话后回来 → 面板状态跟着变（订阅生效），不是停在上一个会话
C 目录与权限
  · 资料目录可读写；密钥文件存在且权限 600
  · MinerU token 状态回显是掩码（能看出「已配置」，看不到原文）；未配置就说「未配置」，不阻塞安装
E 装机层全量核验（一条命令，给 A/B/C 一个可复跑的骨架）
  · 跑：node <脚手架>/scripts/check-profile.mjs
        指定 profile 或只看一个：node <脚手架>/scripts/check-profile.mjs --profile "<profiles/web 绝对路径>" --only <slug>
  · 它读的是**装机副本**（不是源码树），逐包输出：版本 / 面板 newSession·subscribe / 界面在不在 / bundles 登记 / dependencies；退出码 0 才算过
  · 三种界面形态都认：`public/`（iframe 装进来的独立前端）、**内联在 lib/client.js**（体积过百 KB 的仓就是这样）、`缺`（判红）
  · `.bak-*` 这类残留副本会单独列出来，不参与判定，但要提醒用户清理（它们会让列表里出现重复项）
  · 这一步**不能替代 B 的点击**：脚本不碰 UI，界面是否真的加载、点了有没有反应仍需人验
  · 结果照抄成一句：「装机层 45/48 通过；3 个红：<包名 + 原因>」

D 状态如实记录
  把 A/B/C 每条写成三态之一：**实测通过 / 骨架 / 未实现**；没观察到的一律写「未验证」。
  静态检查通过不等于界面加载通过，界面加载通过不等于业务可用。

========== 结束时的汇报（固定六段） ==========
1 一句话结论：装成了没有
2 装到哪：profile 绝对路径 + 装机版本 + 包名
3 依据：health / ui / primer / AI 面板 / 目录权限 各自的实测结果（三态分开写），外加一句装机层核验数字（如 45/48，红的列名字+原因）
4 未通过或未验证的项，逐条写清卡在哪、下一步查什么
5 第一个建议动作（只给一条，可执行）：
   例：「打开左侧『小橡宝 · 胸腺癌工作台 v0.2.0』，点顶栏「?」看四段疾病概要；确认无误后我们在右侧「AI 对话」里问第一个问题」
6 本次动了哪些本机状态：安装的包、新建的目录、写下的密钥文件路径（不写内容）

========== 不要做的事 ==========
不要装到 ~/.dsh 或 DeepSeek Harness；不要自行重启 Desktop；不要替用户选资料目录；不要把 token 回显或写进仓库；不要把演示数据放进资料目录；不要用 `pnpm add` 之外的花招绕过 bundle 登记；check/audit 有 fail 不要说「基本通过」。
```

## 四步与判据的对应

| 你要的 | 提示词里的位置 | 判据 |
| --- | --- | --- |
| ① 安装检测 + 指导部署，用户同意，定目录与权限 | 第 0、1、2 步 | 打印判定基准；用户明确「同意」；资料目录非敏感位置、700 |
| ② clone + 环境变量申请（MinerU 等） + 本地病情目录树与项目匹配 | 第 3 步 | clone 成功；token 落 600 密钥文件且只出掩码；目录树打印给用户看 |
| ③ 首次应用激活（tar 包） | 第 4、5 步 | tgz 四要素；`pnpm add` 成功；bundle 登记；装机副本版本/文件核对；重开后点顶栏「AI 对话」→ 自检状态、无会话就创建并显示原生面板 |
| ④ 综合功能检查 + 安装通过消息 + 第一个建议动作 | 第 6 步 + 汇报 | A/B/C 逐条三态；六段汇报；只给一条下一步 |
| ⑤ 装机层全量核验（可复跑） | 第 6 步 E | `scripts/check-profile.mjs` 退出码 0；残留副本单列并提示清理 |

## 常见失败与对症

| 现象 | 先查什么（按顺序，别跳） |
| --- | --- |
| 工作台列表里看不到 | 装错 profile → `dsh.profile.bundles` 没登记 → Desktop 没真正退出重开 → 包内缺 `dsh/index.js` |
| 装上了但业务区空白 | 包内既没有 `public/` 也没有内联视图（看 `lib/client.js` 体积）；仓里有 `public/` 但包里没有 → `package.json` 的 `files` 漏了它；或 UI 路由注册路径带了尾斜杠（`/ui` 本身会 404） |
| 页面正常但「?」点了没反应 | `public/` 里缺 primer 三件套，或原型里的 `../../assets/patterns/...` 未改写成 `./patterns/` |
| 点「AI 对话」没反应 | 用 `Boolean(conversation)` 判会话（宿主恒传隐藏容器）→ 必须改宿主归属判定；或按钮 `disabled` 锁死 |
| 切换会话后面板不刷新 | 没订阅 `desktopWorkbenches.subscribe`；注意订阅必须落在 Panel 内、`return` 之前（误插会变成死代码） |
| `pnpm add` 报 ENOENT / store 校验失败 | profile 里有指向已删除 tgz 的 `file:` 依赖 → 先盘一遍存在性；或加 `--config.strict-store-pkg-content-check=false` |