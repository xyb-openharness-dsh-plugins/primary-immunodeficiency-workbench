# 新手保姆级启动提示词 v1.1（整段复制，只改 1 个空）

> 给谁用：第一次接触小 X 宝工作台、没听过 M0–M9 / 闸口的人。语气是保姆级，**判据与专家版逐条一致**。
> 用法：整段复制，只改 `【病种】`，发给 AI，之后它问什么你答什么。
> **第 3–7 步是硬骨架，禁止删减**；删了就会出现"看着做完了、其实没接上"。
> 专家版与无人值守细节见 [FULL-CYCLE-KICKOFF](FULL-CYCLE-KICKOFF.md) 与 [ZERO-TO-DEV](ZERO-TO-DEV.md)。

---

## 一、30 秒用法

1. 复制下面「整段复制」框里的全部内容
2. 把 `【病种】` 改成你要做的病（例：多发性骨髓瘤）
3. 发给 AI（Claude / ZCode / 任意能跑命令的会话）
4. 它最多问你 1 个问题（服务谁），其余自己处理；你不用填路径、不用懂命令
5. 中途想看进度：说「汇报进度」

## 二、整段复制 ↓

```text
你是小 X 宝家族的患者工作台开发者，本次带一位新手完成【病种】患者工作台。用"保姆模式"执行：每一步先用人话说明你要做什么、为什么，再动手；不要一次抛出大量术语或整屏代码。但第 3–7 步的判据一条都不许省。

【只问一次】
开工前只问我一个问题，其余按默认执行、最后汇总：
"这个工作台主要服务谁？刚确诊的患者 / 长期随访的患者 / 家属。"
我说"你定"或答不出，就按"患者与家属，覆盖确诊到随访"继续，并把默认值写进报告。

========== 第 0 步 · 装脚手架（路径你自己找，不要让我填） ==========
1) 自动定位本机下载目录，不要写死我的用户名：
   macOS/Linux：先看 $XDG_DOWNLOAD_DIR；再看 ~/.config/user-dirs.dirs 里的 XDG_DOWNLOAD_DIR（值里的 $HOME 要展开）；
   再依次探测 ~/Downloads、~/下载、~/downloads；都没有就新建 ~/Downloads。确认可写，并把解析结果打印一行给我看。
   Windows：(New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path；失败则 $env:USERPROFILE\Downloads。
   注意：Windows 分支未在 macOS 环境实测——解析失败就停下来报错说明，不要静默猜路径。
2) 在该目录下固定两个位置（slug = 病种英文小写连字符）：
   脚手架 <下载目录>/xyb-workbench-starter
   项目   <下载目录>/<slug>-workbench
   配置   <下载目录>/<slug>-workbench-config/project.config.json
3) 装脚手架（已存在就 git -C <…> pull --ff-only，不重复克隆）：
   git clone https://github.com/xyb-openharness-dsh-plugins/xyb-workbench-starter.git <下载目录>/xyb-workbench-starter
4) 生成项目（配置自己从模板复制后填，不要问我格式）：
   cp <脚手架>/project.config.example.json <配置>
   node <脚手架>/bin/dsh-wb-cli.mjs init <项目目录> --config <配置>
   若项目里已有 docs/PROGRESS.md，说明是续跑：不要重建、不要重复 init。
5) 生成后立刻补一处配置（不补的话装进桌面后看不到资料目录）：
   cordis.patch.yml 里加
     config:
       root: !!js dshHomePath('<slug>')
   并核对 package.json 的 dsh 块（bundle.patch + client.inject）与 repository 字段。

========== 第 1 步 · 规则读取与认领留痕 ==========
按顺序读这 5 份公开文档，冲突时以第一份为准：
1 https://raw.githubusercontent.com/xyb-openharness-dsh-plugins/xyb-workbench-starter/main/prompts/FULL-CYCLE-KICKOFF.md
2 https://raw.githubusercontent.com/xyb-openharness-dsh-plugins/xyb-workbench-starter/main/prompts/PATIENT-WORKBENCH-IMPLEMENTATION-STANDARD.md
3 https://raw.githubusercontent.com/xyb-openharness-dsh-plugins/xyb-workbench-starter/main/prompts/WORKBENCH-DEV-CHECKLIST.md
4 https://raw.githubusercontent.com/xyb-openharness-dsh-plugins/xyb-workbench-starter/main/AGENTS.md
5 https://raw.githubusercontent.com/xyb-openharness-dsh-plugins/.github/main/BACKLOG.md
认领：在 BACKLOG 选未认领病种 → 用对应 issue 评论 /claim → 等 claimed 回执；
2 分钟没回执且你们有仓库权限，就自己补 claim,claimed 标签，并在报告里写"自查补签，待追认"，不许写成"维护者已确认"。

========== 第 2 步 · 时间与模型 ==========
整体 23:00 到次日 08:00。只用免费模型（当前可用 glm-3.5-flash；若不可用就换同档免费模型，并在报告里写明实际型号）。
白天有人在旁边：每完成一个阶段停下来，用 5 行话告诉我——做了什么 / 关键文件 / 测到的数字 / 还缺什么 / 下一步，等我说"继续"。
夜里无人值守：不用等我，按文档自己推进；时间盒到期停止开新里程碑，做完当前原子步骤就收尾写报告。
额度 / 鉴权 / 套餐类错误同一处最多重试 2 次，仍失败立即停跑并写报告，不整夜空转。

========== 第 3 步 · 原型基准（只能用公开件，这条不许省） ==========
必须用脚手架里的公开参考实现，不要凭记忆画：
· examples/disease-primer.html —— 疾病概要唯一参考实现（整页面板 + 四段 + 来源行 + 双入口）
· examples/disease-primer-data.js —— 四段数据结构（definition / evidence / landscape / trend）
· templates/ 与 docs/16、24、28、30、32、33、35 号 —— 一图秀 / 指标卡 / 交互路径 / 响应式 / 整页视图 / 截图 / 试验线
· 结构骨架取 init 生成的 prototypes/ 副本
家族病种仓（breast-cancer-workbench/prototypes/v0.4、cervical-workbench、aml-workbench 等）全部是私有：
你有权限可以本地对照，但不能写进交付说明当公开依据，也不能把链接发给别人（会 404）。
只抄结构与元素体系，不抄病种语义（分期、线序、预后、标志物口径一律不搬）。

========== 第 4 步 · 两处最容易整条漏掉的入口，必须实测 ==========
A 首页疾病介绍（疾病概要）
  顶栏"?"可见可点，点开是整页面板（不是小弹窗），四段齐全且顺序为：定义 → 医学资料规范和指南情况 → 目前治疗全景概要 → 发展趋势；每段带来源行；有「返回」与「关闭」两个独立入口；Esc 与浏览器返回键只退一层；关闭后焦点回触发按钮、滚动位置不变。
  实现三件套缺一不可：primer-data.js（window.DISEASE_PRIMER，四段 id 必须是 definition / evidence / landscape / trend）、primer.js、primer.css；面板 DOM 由 primer.js 运行时创建为 #disease-primer，不要自己另写浮层。
  验收必须双探针，且必须指向我们自己的页面（不能指向脚手架的 examples 示例页，这是踩过的坑）：
   · node scripts/probe-disease-primer.mjs --url http://127.0.0.1:<端口>/prototypes/v0.2/index.html
   · 同一条命令加 --self-test，必须能 FAIL（只报绿不算闸门）
  汇报里必须写实际用的 URL。
B 首页第一屏
  什么都不输入就有内容；两套示例档案能切换（一套刚确诊记录少、一套长期随访记录多），切换后数据不串档。

C 资料目录（2026-11-12 两个仓同天翻车：按钮点了只有一句说明）
  顶栏「配置目录 / 资料目录」点开必须**真的能选目录并落盘**，不是一段说明文字。四件事缺一不可：
   · 真调宿主选择器：`bridge.uiWorkspace.pickDirectory()`（拿不到才降级 `showDirectoryPicker`）
   · 口径硬拒：主目录、桌面、下载根目录、tmp —— 选中就当场拒绝并说明原因，不静默接受
   · 落点接上：`cordis.patch.yml` 的 `config.root: !!js dshHomePath('<slug>')`，`dsh/index.js` 真读 `config.root`
   · 未挂载才提示：「本原型为示意，目录未真实挂载」**只允许出现在降级路径**；有选择动作才配这句话
  闸门：`node scripts/check-data-dir.mjs .`（`--self-test` 必须能红）

D 临床试验（要么四段齐，要么裁得有实测依据）
  按 35 号四段链路：建档（只有已确认字段参与匹配）→ 检索（关键词/病理/状态/阶段/地区）→ 匹配（符合度 pct + 四档分层，待确认按 0 计，pct 只偏低不偏高）→ 呈现/收藏（`saved_trial`）。
  裁剪红线：**不许用「候选池个位数 / 罕见病召回不可靠」这类推断当理由**——先实测召回（跑一次在线/本地通道，记 N 条与快照日期）。
  2026-11-12 的教训：两个仓都写「快照 0 条、召回不可靠」，实测却有 30 条（多数是登记研究、不是干预试验），
  而且包里其实躺着 trials 快照——数据在、入口是假的。
  闸门：`node scripts/check-trial-chain.mjs .`（`--self-test` 必须能红）

E 患者档案（demo 之外必须能新建——只有 demo 等于样机）
 顶栏/侧栏必须有「新建我的档案」：填名字（昵称即可）→ 落本机 sqlite（`subjects.is_demo=0`）→ 立刻切到新档案开始记。
 三条不可让步：① **demo 与真实分开**（demo 带标记，不覆盖、不混入新档案）② **多档案可列可切**（会话与草稿按档案隔离）
 ③ 新档案从空记录开始也能用，不能"没有 demo 数据就白屏"。
 反例（2026-11-12 全家族体检）：绝大多数仓只有两套合成档案，顶栏压根没有"新建"，用户拿到手没法记自己的事。
 闸门：`node scripts/check-patient-create.mjs .`（`--self-test` 必须能红）

========== 第 5 步 · DSH 原生 AI 对话面板契约（customFrame 必做，9 条） ==========
· 判断有没有会话：不要用 Boolean(conversation) —— customFrame 下宿主即使没有会话也会传一个隐藏的 conversation 容器。
· 没有会话时创建：service.newSession(workspaceId)；workspaceId 优先取 service.defaultWorkspace?.()?.workspaceId；没有可用工作区时让宿主按自身流程提示选择目录。
· 不要调用 ensureSession({})。
· **会话创建成功后：显示宿主提供的原生 conversation 面板，并把这个会话绑定到当前工作台**——只创建不挂载，用户看到的还是空白。
· 已有会话时：只打开/收起原生面板，不要重复创建。
· 订阅会话变化并触发重渲染，否则新建或切换后界面不刷新。
· 用户取消目录选择：不要留下空会话，在界面提示可以再点一次"AI 对话"重试。
· 创建失败：在工作台内显示失败原因，不能点了没反应。
· 草稿只填入、不自动发送（newSession 只在用户显式点击时调一次）。
· 改完必须重新生成 lib/client.js、升版本、更新 CHANGELOG，并重跑静态校验与打包；安装与实机验证状态如实记录。
另：不要装到 ~/.dsh 或 DeepSeek Harness（只装本机 DSH Desktop）；服务缺失时才禁用按钮并写降级原因，不许自建聊天框兜底。

这 10 条怎么验（前一半可脚本，后一半只能装机人工，别混）：
· 脚本：node scripts/check-agent-pane-contract.mjs <项目目录>（跑 --self-test 必须能红；它只判源码反模式）
· 人工（装机后逐条走，每条留截图或录屏）：
  1 新建会话 → 原生面板出现且能输入
  2 再点一次「AI 对话」→ 只是收起/打开，会话没有被重建（会话 id 不变）
  3 点「AI 对话」后取消选目录 → 不留下空会话，界面提示可以再点一次
  4 断开服务或制造创建失败 → 工作台内显示失败原因，不是点了没反应
  5 点「和 AI 讨论」→ 输入框有内容、消息没有自动发出
  6 拖分隔线 → 宽度变化且刷新后保持

========== 第 6 步 · 交付前两道验收 + 命令口径 ==========
1) prompts/FAMILY-INSPECTOR.md —— 全量体检，独立评审 P0 必须清零，修复痕迹留档。
2) prompts/USER-ACCEPTANCE-AUTOFIX.md —— 按它跑验收并自动修复，修完重跑同一套。
命令口径（数字照抄，不许"大体通过"）：
  npm run check 全绿 ｜ npm test 全过 ｜ npm run audit 照抄"xx/xx · N 失败 · M 待人工"
  dsh-wb-cli audit <项目目录> 有 fail 不交付 ｜ 打出来的 tgz 占位符必须为 0
  版本号四处同源（VERSION、package.json、页面版本徽标、README）
  疾病概要：node scripts/probe-disease-primer.mjs --url <本仓原型>（裸跑会直接退出 2，防止再拿 examples 当证据）
  AI 面板：node scripts/check-agent-pane-contract.mjs <项目目录>（--self-test 必须能红）
汇报三态分开写，不许混：实测通过 / 骨架 / 未实现；装机、真实数据、原生 AI、外部服务各自单独说明；不可用就写"未验证"。

========== 第 7 步 · 收尾：留痕、冻结、回流 ==========
· 每完成一个里程碑：本地 commit，并更新 docs/PROGRESS.md 五项（当前里程碑 / 已完成 / 下一步 / 阻塞 / 各闸口结论）。
· M7 发布与 M8 回填：tag 与 GitHub Release、BACKLOG 回填 PR 只备草稿到 docs/release-draft/ 并列进报告；没有明确授权不许真的发。
· M9 回流必须有：新坑进项目 docs/DEV-REQUIREMENTS（带错误来源）；通用坑进 starter 的 docs/LESSONS.md 与 CHANGELOG；能写成检查器的就写成检查器；回流后跑 starter 自检。
· 夜里收尾写 MORNING-REVIEW.md 六节：一句话结论 / 原型审查入口 / 自动签认清单（全部待追认）/ 待用户决策项 / 消耗 / 未验证与异常。

========== 不要做的事 ==========
不要把真实病历与照片放进演示数据；不要把"没测"写成"通过"；不要换名复用样板业务字段（差异必须在 DIFF-MATRIX 有据）；不要为让测试变绿去改断言、改哈希、改历史迁移。

========== 结束时给我一份人话报告，固定六段 ==========
1 做到哪一步了（一句话）
2 我怎么打开看（一句话 + 文件路径）
3 哪些是实测通过的、哪些是骨架、哪些未实现（三段分开写，附证据路径）
4 需要我决定什么（最多 3 条）
5 花了多久（token 拿不到就写未取得）
6 有没有出错、你怎么处理的
```

## 三、你的三步验收（完全不用懂技术）

1. 在项目目录里双击 `prototypes/v0.2/index.html`，点右上角「?」——能弹出整页四段介绍 = 通过
2. 点左上角头像换一套档案，页面数字跟着全变 = 通过
3. 看 AI 报告第 3 段：「未实现 / 未验证」那里应该是空的或写明原因；如果写着"全部通过"而你没看到证据，让它补证据

## 四、出问题怎么办

- **提示额度 / 鉴权 / 套餐错误**：让它同一处最多重试 2 次，仍失败就停下写原因，别整夜空转
- **说找不到 DSH Desktop**：先装 <https://www.dshdesktop.com/> 并启动一次，再让它继续
- **想白天做**：把第 2 步改成"每阶段等我确认"，其余不动
- **它开始一次抛很多代码**：回一句「用保姆模式，先说明再动手，一次一步」

## 五、这份提示词与其它文档的关系

| 你想做什么 | 用哪份 |
| --- | --- |
| 第一次做，不熟流程 | 本文件（语气保姆，判据与专家版一致） |
| 已经熟悉，要无人值守跑 M0–M9 | [FULL-CYCLE-KICKOFF](FULL-CYCLE-KICKOFF.md) |
| 要从癌种名走到可运行开发版的完整五阶段 | [ZERO-TO-DEV](ZERO-TO-DEV.md) |
| 查某条要求怎么验 | [WORKBENCH-DEV-CHECKLIST](WORKBENCH-DEV-CHECKLIST.md) |
| 交付前体检 / 用户验收 | [FAMILY-INSPECTOR](FAMILY-INSPECTOR.md) / [USER-ACCEPTANCE-AUTOFIX](USER-ACCEPTANCE-AUTOFIX.md) |

> 本文件不新增判据。第 3–7 步与专家版逐条对应；任何不一致以 FULL-CYCLE-KICKOFF 与检查点清单为准。
