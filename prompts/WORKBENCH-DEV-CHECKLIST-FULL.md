# 开发检查点全量索引（185 条，带 file:line）

> 本文件是 [WORKBENCH-DEV-CHECKLIST.md](WORKBENCH-DEV-CHECKLIST.md) 的附录：主文件给「逐条勾的断言」，本文件给「全量条目 + 出处 + 现有检查手段」，两者编号一致，冲突以主文件为准。
> 用途：主文件没覆盖到的细节，按编号查这里；写检查器时按「现有检查手段」列判断是补断言还是补文档。


> 范围：docs/16、19、20、23、24、27、28、30、32（整页 + 治疗路径折叠卡）、33、34、35、36、40、AGENTS.md，以及 templates/、scripts/ 下现有检查器。
> 判读：只抄原文可断言的精神，未臆造；「需人工走查」= 目前没有脚本能自动判。
> 检查手段写的是仓内实际存在的文件；`templates/*.mjs` 由 init 下发到项目 `scripts/`，仓根 `scripts/*.mjs` 是家族自带探针。

## 一、一图秀（C1–C12 及规范补充）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| C1 | 选 2 个量纲差异大的指标，两条 path 的 `getBBox()` 高度差 <10%（都占满纵向区） | docs/16-ONE-CHART-SPEC.md:44-47,171 | 无（模板仅签认行 templates/ONE-CHART-SPEC.md:67） |
| C2 | 单点序列 DOM 中无 `<path>`、有 1 个 `<circle>`，并显示"只有 1 次记录，暂不连线" | docs/16-ONE-CHART-SPEC.md:49-52,172 | 无 |
| C3 | 时间窗无点时显示空态文案"没有所选指标"+扩大范围/加选指标入口，不是空 `<svg>` | docs/16-ONE-CHART-SPEC.md:52,173 | 无 |
| C4 | 关"治疗节点"前后，所有 `path[d]` 字符串逐字相同 | docs/16-ONE-CHART-SPEC.md:54-57,174 | 无 |
| C5 | 每序列数值标签数 =1（只标末点，首点不标） | docs/16-ONE-CHART-SPEC.md:59-62,175 | 无 |
| C6 | 所有 `<text>` 的 bbox 在 viewBox 内；末点距右缘 <46px 时 `text-anchor=end` 并内移 | docs/16-ONE-CHART-SPEC.md:62,176 | 无 |
| C7 | 康复/围度类变化文案匹配 `[+-]\d+(\.\d+)?(cm\|kg)` 且不含 `%` | docs/16-ONE-CHART-SPEC.md:64-67,177 | 无 |
| C8 | 切"近 3 月"后 X 轴首刻度=窗口首月、点数减少，图例仍标"全期" | docs/16-ONE-CHART-SPEC.md:79-82,178 | 无 |
| C9 | 390px 下 `document.documentElement.scrollWidth === 390`；横滚只发生在 `.chart-wrap` | docs/16-ONE-CHART-SPEC.md:89-92,179 | 无 |
| C10 | 模拟 `prefers-reduced-motion: reduce` 后线仍可见，`stroke-dashoffset` 计算值 =0 | docs/16-ONE-CHART-SPEC.md:94-97,180 | 无 |
| C11 | 翻转前后卡片 `getBoundingClientRect()` 的 x/y/w/h 完全一致，内层 transform 含 `matrix3d` | docs/16-ONE-CHART-SPEC.md:118-123,181 | 无 |
| C12 | 翻一张卡后仅该卡 `aria-pressed=true`，其他卡仍为 false | docs/16-ONE-CHART-SPEC.md:124,182 | 无 |
| 16-0.2a | 归一化基准取该指标**全部记录** min/max；零跨度兜底 `span = hi-lo \|\| max(\|hi\|*0.08,1)` | docs/16-ONE-CHART-SPEC.md:26-31 | 无 |
| 16-0.2b | 图上有一句**可见**文字"每条线按该指标全部记录范围缩放，不代表不同指标数值可比"（不在 tooltip） | docs/16-ONE-CHART-SPEC.md:19-20,106 | 无 |
| 16-2.1 | 卡片结构必须是 `button.mcard > .mcard-inner > .front + .back`，状态独立存 `Set`，不重渲染 | docs/16-ONE-CHART-SPEC.md:111-125,190 | 无（templates/FLIP-METRIC-CARD.md 只有人工验收） |
| 16-3 | 筛选/缩放/翻卡只重绘 `#chart-panel`，不整页重渲染（保焦点、翻转态、滚动位） | docs/16-ONE-CHART-SPEC.md:144 | 无 |
| 16-5 | 同屏序列 ≤4、单序列 ≤200 点、超限给提示并聚合标"已按月聚合"，不静默 | docs/16-ONE-CHART-SPEC.md:158-165 | templates/check-choice-limit.mjs（仅 checkbox 上限形态） |
| 16-7 | 100+ 记录/500 事件仍保持固定趋势区高度；事件在独立轨道按相邻时间聚合，禁止隐藏/删除原始事件 | docs/16-ONE-CHART-SPEC.md:216-218 | 无 |

## 二、原型工艺（19 号，无编号，按小节取断言）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| 19.1 | 所有多列网格写 `minmax(0,1fr)`，页面级横向溢出 0 | docs/19-PROTOTYPE-CRAFT.md:34,113 | 无（参考仓 probe-responsive 未随本仓） |
| 19.2 | 数字 `tabular-nums`；可点元素 `min-height:44px`；`:focus-visible` 3px 品牌深色 outline + 2px offset | docs/19-PROTOTYPE-CRAFT.md:23,114 | 无 |
| 19.3 | 折线 `pathLength="1"` + `stroke-dasharray:1;stroke-dashoffset:1`；reduced-motion 下显式 `dasharray:none;dashoffset:0` | docs/19-PROTOTYPE-CRAFT.md:62,68 | 无 |
| 19.4 | 翻卡真 3D：`perspective:1200px` + `preserve-3d` + 背面预转 180° + `backface-visibility:hidden` + 固定高 194px | docs/19-PROTOTYPE-CRAFT.md:64,115 | 无 |
| 19.5 | 指标上限拒绝分支内必须显式 `el.checked=false` 或分支内 `render()`，不能靠调用方兜底 | docs/19-PROTOTYPE-CRAFT.md:79-86 | templates/check-choice-limit.mjs |
| 19.6 | zoom 只动左边界，右端恒锚定最新日期（40–100%） | docs/19-PROTOTYPE-CRAFT.md:87 | 无 |
| 19.7 | 二级页签按 `state.sub[view]` 分流：各 tab 内容互不相同、有专属空态、内容与页签名同名 | docs/19-PROTOTYPE-CRAFT.md:94,117 | 无（LESSONS harness 未随仓） |
| 19.8 | tooltip 按 clientX 换算图坐标取欧氏最近点，离开 SVG 立即收起 | docs/19-PROTOTYPE-CRAFT.md:75 | 无 |
| 19.9 | dialog 固定外壳 head/body/foot，只有 body 滚（`max-height:calc(100vh - 250px)`），关闭按钮 38px 圆形 icon | docs/19-PROTOTYPE-CRAFT.md:52 | templates/check-dialog-handoff.mjs（只查到点，不查外壳） |
| 19.10 | 空态必须给下一步动作（虚线框+居中+可执行建议），不能只写"暂无数据" | docs/19-PROTOTYPE-CRAFT.md:44 | 无 |

## 三、Agent 面板（20 号）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| 20.1 | 业务区在左、原生会话默认在最右（`businessSide:'left'`），不得左右互换 | docs/20-AGENT-PANE-DESIGN.md:55-63 | 无（AGENTS:88 同口径） |
| 20.2 | 面板默认 35%，可拖 25%–45%，步进 2%；窄容器 <760px 改覆盖抽屉 ≤420px | docs/20-AGENT-PANE-DESIGN.md:45,81 | scripts/check-conformance.mjs:120 `panel/会话区区间`；templates/check-host-contract.mjs |
| 20.3 | 宽度只有一份来源 `lib/layout.js` 的 `PANEL`/`AGENT_PANE`，客户端不写第二份 0.65/0.35 | docs/20-AGENT-PANE-DESIGN.md:67-69 | scripts/check-conformance.mjs:99 `panel/单一来源` |
| 20.4 | splitter 带 `role="separator"` + `aria-valuemin/max/now` + `tabindex=0`；←/→ 步进 2%，Home/End 到边界 | docs/20-AGENT-PANE-DESIGN.md:77-78 | 无（40 号 §5.1 可静态断言） |
| 20.5 | 拖动量按容器 rect 夹取，不用 `window.innerWidth`；localStorage 读回必须过 `clampAgentWidth()` | docs/20-AGENT-PANE-DESIGN.md:76,79 | docs/40-A-FAMILY-PANEL-STANDARD.md:474-475（grep 可执行） |
| 20.6 | 开合入口只在顶栏（五态按钮+独立 ×），面板内部无第二组开合控件 | docs/20-AGENT-PANE-DESIGN.md:85 | templates/check-agent-draft-bridge.mjs A4（只查演示面板） |
| 20.7 | 收起只切 `paneOpen`/`display`，不卸载 conversation、不调 close/delete，草稿仍在 | docs/20-AGENT-PANE-DESIGN.md:86-87 | scripts/check-conformance.mjs:146 `panel/会话区常挂载`（静态） |
| 20.8 | 序列类/清单类/核对类/关注类来源页草稿只带已确认项，未核对候选禁止进草稿；私密默认不带 | docs/20-AGENT-PANE-DESIGN.md:95-103 | 无 |
| 20.9 | 宿主 API 缺位时走剪贴板回退，绝不"自建聊天框"兜底或假成功 | docs/20-AGENT-PANE-DESIGN.md:100-101 | 无 |

## 四、指标分级与提醒（23 号 M1–M11）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| M1 | 指标卡按类别分组，组名/顺序/项数与一图秀完全一致（同一 `categoryOrder`） | docs/23-METRIC-GRADING-AND-ALERTS.md:21-30,209 | 无 |
| M2 | 无记录的指标仍列出，但不显示分级徽章 | docs/23-METRIC-GRADING-AND-ALERTS.md:27,210 | 无 |
| M3 | ×ULN 型缺参考上限时返回 `needsUln` + 虚线徽章"需参考上限"，不出现通用上限算出的级别 | docs/23-METRIC-GRADING-AND-ALERTS.md:44,72-75,211 | templates/check-medical-threshold.mjs（只覆盖绝对阈值函数形态） |
| M3b | 有上限时卡面同时给级别+区间+实测倍数，倍数服务端算、前端不做除法 | docs/23-METRIC-GRADING-AND-ALERTS.md:81,212 | 无 |
| M3c | 单位不符（QTc 填 0.46）返回 `needsUnit`，提示换单位，不自动换算 | docs/23-METRIC-GRADING-AND-ALERTS.md:88,213 | 无 |
| M4 | 阈值边界单测：等号归上一级（ANC 1.5=1 级/1.4=2 级；ALT 120=1 级/120.1=2 级） | docs/23-METRIC-GRADING-AND-ALERTS.md:82,214 | 项目单测（模板未提供） |
| M4b | 参考值落库校验：先挡 `null/undefined/''` 再转数字，非数字/上限<下限报错 | docs/23-METRIC-GRADING-AND-ALERTS.md:215 | 无 |
| M4c | 未采用的原文分支（QTc >60ms、G4 心律失常）在注释写明"未采用"及原因 | docs/23-METRIC-GRADING-AND-ALERTS.md:87,216 | 无 |
| M5 | 徽章文案固定"对照 CTCAE v<版本> · N 级"；不得出现偏高/偏低/异常/轻中重/建议复查 | docs/23-METRIC-GRADING-AND-ALERTS.md:110,217 | 无（check-wording 未随仓） |
| M6 | 用通用下限时显示"按通用下限"；无绝对数值界限的级不显示（贫血最多到 3 级） | docs/23-METRIC-GRADING-AND-ALERTS.md:59-62,218 | 无 |
| M7 | 提醒只在 `paired` 出现；`labsOnly` 不弹提醒但徽章仍在；仅感受不生成提醒 | docs/23-METRIC-GRADING-AND-ALERTS.md:138-146,219 | 无 |
| M8 | 提醒条两列并置、各带日期与来源，无因果句/处置句；场景词按实际治疗记录决定 | docs/23-METRIC-GRADING-AND-ALERTS.md:150-160,220 | 无 |
| M9 | 标准原文随包放 `assets/reference/<standard>/`，接口按元信息常量取文件名并校验目录边界 | docs/23-METRIC-GRADING-AND-ALERTS.md:181-183,221 | 无 |
| M10 | 卡片背面（固定高度）放上区间与免责后页脚仍可见，无内容被裁 | docs/23-METRIC-GRADING-AND-ALERTS.md:222,245 | 无（需 rect/截图） |
| M11 | 窄窗口 ≤760px 两列提醒自动堆叠，页面无横向溢出 | docs/23-METRIC-GRADING-AND-ALERTS.md:223 | 无 |

## 五、指标趋势 Tab 与 3D 卡片（24 号 MT01–MT15，27 号补充）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| MT01 | 从全局"病情整理"进入"指标检测"，五个页内 Tab 与旧深链接映射可走通 | docs/24-METRIC-TREND-TAB-DESIGN.md:129 | 无 |
| MT02 | 肿瘤标志物、血常规等各自独立标题与网格，不混在一个平铺容器 | docs/24-METRIC-TREND-TAB-DESIGN.md:130 | 无 |
| MT03 | 指标页与一图秀同一目录，组名、顺序、项数一致 | docs/24-METRIC-TREND-TAB-DESIGN.md:131 | 无 |
| MT04 | 正面完整显示类别/名/值/单位/日期/次数/来源；差值不写疗效结论 | docs/24-METRIC-TREND-TAB-DESIGN.md:132 | 无 |
| MT05 | 单点、0 值、空态、文本值、未知日期分别显示正确（0 不显示为"无记录"） | docs/24-METRIC-TREND-TAB-DESIGN.md:133 | 无 |
| MT06 | 方法/单位/机构变化不跨组连线或做差；同日无顺序不做"前次" | docs/24-METRIC-TREND-TAB-DESIGN.md:134 | 无 |
| MT07 | 点击两次恢复正面；其他卡状态与页面高度不变，无上下叠加 | docs/24-METRIC-TREND-TAB-DESIGN.md:135 | 无 |
| MT08 | 鼠标与键盘都可翻面；隐藏面不进 Tab 序；减少动效下无旋转过程 | docs/24-METRIC-TREND-TAB-DESIGN.md:136 | 无 |
| MT09 | 点数据点打开来源详情，整卡不翻回；关闭后焦点回原卡/原点 | docs/24-METRIC-TREND-TAB-DESIGN.md:137 | 无 |
| MT10 | 候选核对前不入图；核对后 SQLite 重开仍在，两页读同一值 | docs/24-METRIC-TREND-TAB-DESIGN.md:138 | 无 |
| MT11 | "最近一次报告"表来自同一报告 ID/修订，未知区间明确留空 | docs/24-METRIC-TREND-TAB-DESIGN.md:139 | 无 |
| MT12 | 700/620px/窄内容区/大字下无整页横向溢出，二列→一列合理 | docs/24-METRIC-TREND-TAB-DESIGN.md:140 | 无 |
| MT13 | 病例切换隔离翻面/筛选/草稿，不串患者信息 | docs/24-METRIC-TREND-TAB-DESIGN.md:141 | 无 |
| MT14 | 100+ 记录、500 事件压力数据下曲线仍在固定区域，原始事件可逐项回查 | docs/24-METRIC-TREND-TAB-DESIGN.md:142 | 无 |
| MT15 | HTML 版本/hash、截图、偏差、确认范围、真实 Desktop 验收状态分别记录 | docs/24-METRIC-TREND-TAB-DESIGN.md:143 | templates/METRIC-TREND-SPEC.md（签认表，人工） |
| 24-5a | 外卡 `height:276px`（大字模式 340px），正反面同高，内容不得撑开 | docs/24-METRIC-TREND-TAB-DESIGN.md:72,80 | 无 |
| 24-5b | 两面 `position:absolute;inset:0` + `backface-visibility:hidden` + 背面预转 `rotateY(180deg)` | docs/24-METRIC-TREND-TAB-DESIGN.md:75,84-86 | 无 |
| 24-5c | 隐藏面 `aria-hidden` + `inert`，不得有隐藏焦点；整卡 `role=group tabindex=0`，不做嵌套 button | docs/24-METRIC-TREND-TAB-DESIGN.md:90 | 无 |
| 24-5d | 480ms `cubic-bezier(.2,.7,.2,1)`，只按明确点击翻转；hover/滚动/加载不自动翻 | docs/24-METRIC-TREND-TAB-DESIGN.md:76,87 | 无 |
| 27.1 | 页面里没有任何"总分/综合指数/健康评分"，也不能让用户算出总体几分 | docs/27-TRACKS-AND-METRIC-CARDS.md:35,152 | 无 |
| 27.2 | 多轨永不折算、各自独立归一化、不共享纵轴、不出现加权 | docs/27-TRACKS-AND-METRIC-CARDS.md:36-37,153 | 无 |
| 27.3 | 分类变量（Child-Pugh/LI-RADS/Vp）只画节点，不连线、不算差值 | docs/27-TRACKS-AND-METRIC-CARDS.md:38,154 | 无 |
| 27.4 | 正面六段固定顺序：类别眉题→指标名→最近值+原单位→前次差值→一句说明→次数/日期/来源+翻转提示 | docs/27-TRACKS-AND-METRIC-CARDS.md:48-57,155 | 无 |
| 27.5 | 背面四段：指标名+最近 N 次→独立 SVG→分级/区间依据→脚注；不加"查看详情/返回正面"大按钮 | docs/27-TRACKS-AND-METRIC-CARDS.md:63-70 | 无 |
| 27.6 | 固定 276px、整卡点击 480ms；`state.flipped = new Set([code])`，按 key 复原 | docs/27-TRACKS-AND-METRIC-CARDS.md:78-95,159 | 无 |
| 27.7 | 点击只改 `aria-pressed`+`inert`+`inner.style.transform`，不重绘（重绘会断过渡） | docs/27-TRACKS-AND-METRIC-CARDS.md:95,160 | 无 |
| 27.8 | 看板卡与指标页卡必须同一函数，禁止近似重写（会漏 `data-code` 等参数） | docs/27-TRACKS-AND-METRIC-CARDS.md:96-98 | 无 |
| 27.9 | 网格 ≥960/1080px 两列、更窄一列、不做三列；卡高 276px 不随宽度缩 | docs/27-TRACKS-AND-METRIC-CARDS.md:107-113,163 | 无 |
| 27.10 | 1440/1080/860 三档断言 `{cols:2,2,1, overflow:false, h:276}` | docs/27-TRACKS-AND-METRIC-CARDS.md:126-132 | 无 |
| 27.11 | 隐藏面 `inert`+`aria-hidden`；`prefers-reduced-motion` 直接切终态 | docs/27-TRACKS-AND-METRIC-CARDS.md:161-162 | 无 |
| 27.12 | 缺测写"没有记录/缺测"不显示 0；单位来自原报告不换算；分级徽章只在 ≥1 级出现 | docs/27-TRACKS-AND-METRIC-CARDS.md:156-158 | 无 |

## 六、交互路径（28 号 IP1–IP11、X1–X4）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| IP1 | 无已签认 `docs/INTERACTION-DESIGN.md`（三张表齐全）不开 HTML 原型 | docs/28-INTERACTION-PATH-DESIGN.md:89 | 无（文档存在性可判，签认需人工） |
| IP2 | 双向覆盖：每个一期场景一条路径；每个 `(view,sub)` 被 ≥1 条路径经过，孤儿页=0 | docs/28-INTERACTION-PATH-DESIGN.md:49,90 | 无 |
| IP3 | 路径写的入口名 = 看板渲染文案 = 导航 key，逐字一致 | docs/28-INTERACTION-PATH-DESIGN.md:43,91 | 无 |
| IP4 | 每条路径有可观察产物（记录+1/文件/清单条目）且一步回首页，无死端 | docs/28-INTERACTION-PATH-DESIGN.md:45-46,92 | 无 |
| IP5 | 每个可写实体有 AI 候选通道；候选必经逐项核对，拒收零副作用 | docs/28-INTERACTION-PATH-DESIGN.md:93 | 无 |
| IP6 | 每页显式编辑入口 ≤1；手工入口收在「⋯ 更多」；表单 ≤6 字段；长表单藏「+ 手工添加」 | docs/28-INTERACTION-PATH-DESIGN.md:59-67,94 | 无 |
| IP7 | 数字输入用数字键盘组件，不用文本框 | docs/28-INTERACTION-PATH-DESIGN.md:66,95 | 无 |
| IP8 | 无裸删除：一切删除入口长成"更正"，全站 `grep -c "不可恢复"` = 0，旧版本可查 | docs/28-INTERACTION-PATH-DESIGN.md:78-83,96 | 可 grep，未成脚本 |
| IP9 | 手工改与 AI 确认写同一事实层、同一更正链，不旁路 | docs/28-INTERACTION-PATH-DESIGN.md:97 | 无 |
| IP10 | 每个一级页至少一处 AI 协助示例：预写提示词进输入框、不自动发送 | docs/28-INTERACTION-PATH-DESIGN.md:98 | templates/check-agent-draft-bridge.mjs A1（发送侧反向） |
| IP11 | 每页标题行常驻「和 AI 讨论」，点击带 `discussFacts`（无判定词）进输入框、不代发；弹窗内置"和 AI 讨论这个" | docs/28-INTERACTION-PATH-DESIGN.md:99 | 无 |
| X1 | 页面覆盖双向无孤儿页：文档每个 `(view,sub)` 实现可达，实现每个 `(view,sub)` 被路径认领 | skills/hvt-requirement-review/references/interaction-path-consistency.md:28-33 | 无 |
| X2 | 路径逐字走通：从看板入口按文档点，每步可点、产物可观察、结束一步回首页 | interaction-path-consistency.md:56-63 | 无 |
| X3 | CRUD 通道一致：每页编辑入口 ≤1、表单 ≤6、候选必核、无裸删除 | interaction-path-consistency.md:65-71 | 无 |
| X4 | 走查用无头脚本逐条断言，输出 pass/fail 计数与失败定位，不用截图/口头 | interaction-path-consistency.md:73-85 | 无（LESSONS harness 模式） |

## 七、窄宽自适应（30 号 R1–R6）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| 30.1 | 卡内"标签+值+说明"纵向堆叠，任何并排都算违规 | docs/30-RESPONSIVE-RULES.md:19 | 参考仓 `test/responsive.test.mjs`（未随本仓） |
| 30.2 | 多块并排用 grid + `minmax(0,1fr)`，不用 `flex:1` | docs/30-RESPONSIVE-RULES.md:20 | 同上 |
| 30.3 | 行内标签（`<b>xx：</b>`）不能成为 flex item（用 `::before` 绝对定位） | docs/30-RESPONSIVE-RULES.md:21 | 同上 |
| 30.4 | 允许收缩的容器都有 `min-width:0` | docs/30-RESPONSIVE-RULES.md:22 | `probe:resp`（参考仓，未随本仓） |
| 30.5 | 有意横滚（长路径/表格）必须给 `.scroll-hint` | docs/30-RESPONSIVE-RULES.md:23 | 需人工走查 |
| 30.6 | 数字与日期不换行：`white-space:nowrap` 只用短 token | docs/30-RESPONSIVE-RULES.md:24 | 需人工走查 |
| 30.7 | 断点只三档：≤1180 摘要 2 列、≤900 单列+侧栏横排+AI 抽屉、≤600 隐藏版本 chip | docs/30-RESPONSIVE-RULES.md:28-32 | `probe-responsive.mjs`（参考仓，未随本仓） |
| 30.8 | 任何"每块 <220px"的多列布局都算设计错误，先降列数再缩字 | docs/30-RESPONSIVE-RULES.md:34 | 需人工走查（可用 rect 宽断言） |
| 30.9 | 断点按业务容器宽度算，不用 `window.innerWidth` 判布局 | docs/30-RESPONSIVE-RULES.md:9-13 | 可 grep `innerWidth` |

## 八、整页视图（32 号 A1–A10）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| A1 | 打开后宿主文档滚不动（真滚轮打遮罩），滚的是 `.pv-body` | docs/32-FULL-PAGE-VIEW.md:110 | scripts/probe-page-view.mjs A1 |
| A2 | Esc 一层一退：深 3 层时只退到第 2 层，栈空才回主页 | docs/32-FULL-PAGE-VIEW.md:111 | probe-page-view.mjs A2 |
| A3 | 浏览器返回键等价 `back()`，不跳出工作台 | docs/32-FULL-PAGE-VIEW.md:112 | probe-page-view.mjs A3 |
| A4 | 关闭后焦点回到触发元素（不是 body）；打开后焦点在层内 | docs/32-FULL-PAGE-VIEW.md:113 | probe-page-view.mjs A4a/A4b |
| A5 | 返回主页时滚动位置与点开前一致（±2px） | docs/32-FULL-PAGE-VIEW.md:114 | probe-page-view.mjs A5 |
| A6 | 390px 宽 `scrollWidth <= clientWidth`，无横向溢出 | docs/32-FULL-PAGE-VIEW.md:115 | probe-page-view.mjs A6 |
| A7 | 带 `#page=xxx` 的地址刷新后仍在该页，打不开回主页并提示、不白屏 | docs/32-FULL-PAGE-VIEW.md:116 | probe-page-view.mjs A7 |
| A8 | reduced-motion 下终态完全可见（不停在 `opacity:0`） | docs/32-FULL-PAGE-VIEW.md:117 | probe-page-view.mjs A8 |
| A9 | 顶栏标题为实际页名，无"未命名"、不复用同一标题 | docs/32-FULL-PAGE-VIEW.md:118 | probe-page-view.mjs A9 |
| A10 | 每层同时有「返回」与「关闭」两个可见入口，只给 ✕ 不合格 | docs/32-FULL-PAGE-VIEW.md:119 | probe-page-view.mjs A10 |
| 32-L3 | 可往下长到第三层，且顶栏显示层级路径（`主页 › 病理报告 › …`） | docs/32-FULL-PAGE-VIEW.md:36 | probe-page-view.mjs L3 |
| 32-4 | `open` 必须 `pushState`；禁止 `replaceState` 假装退栈；`popstate` 按 `state.pv` 同步 | docs/32-FULL-PAGE-VIEW.md:68-73 | probe A3/P4（间接），`replaceState` 可 grep |
| 32-5 | 只允许一层遮罩；面板 `inset:clamp(8px,1.2vw,16px)`、圆角 14、顶栏 56 sticky、内容 1180、z 60/62 | docs/32-FULL-PAGE-VIEW.md:81-89 | 无（CSS 静态断言可写） |
| 32-file | 原型双击 `index.html` 能开：`file://` 下不得 `import` ES module，须内联 IIFE 挂 `window.createPageView` | docs/32-FULL-PAGE-VIEW.md:11-14 | 无（grep `type="module"` 可写） |
| 32-3 | 内容 >1.5 屏或需内部分区才开整页，否则弹窗；不得 480px 万能弹窗 | docs/32-FULL-PAGE-VIEW.md:42 | 需人工走查 |

## 九、治疗路径折叠卡（32 号折叠卡）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| 32F-1 | 每阶段一张折叠卡，`<summary>` 只放"阶段名+日期+一句话概要+展开细节 ▸"，默认全部收起 | docs/32-TREATMENT-PATHWAY-FOLDOUT.md:12,26 | 无 |
| 32F-2 | 展开区固定五块且顺序不变：方案→指标和趋势→影像原文→副作用总结→心理/营养措施与效果 | docs/32-TREATMENT-PATHWAY-FOLDOUT.md:14-22 | 无 |
| 32F-3 | 无内容写「无 + 说明」，省略块=违规；影像/副作用禁判读归因；效果只含引号内原话 | docs/32-TREATMENT-PATHWAY-FOLDOUT.md:22 | 无 |
| 32F-4 | 打印展开必须用 `beforeprint`/`afterprint` JS（CSS `@media print` 对 `<details>` 无效），且用 printToPDF 验正文存在 | docs/32-TREATMENT-PATHWAY-FOLDOUT.md:28-36 | 无 |
| 32F-5 | 卡数=阶段数；每卡展开 `section.pd-block`=5；四档宽无溢出、summary 不竖排单字 | docs/32-TREATMENT-PATHWAY-FOLDOUT.md:48 | 无 |

## 十、README 截图（33 号）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| 33.1 | README 至少 4 张关键功能截图 + 1 张展开态（看板/差异化首页/一图秀/红线页/折叠态） | docs/33-README-SCREENSHOTS.md:11-16 | check-readme-assets.mjs（文档:39 提及，仓内无此文件） |
| 33.2 | 截图放 `docs/screenshots/`，命名 `readme-<功能>-<版本>.png`，README 用相对路径且文件存在、<2MB | docs/33-README-SCREENSHOTS.md:19-21,39 | 同上 |
| 33.3 | 1440 宽、浅色、真实渲染（非设计稿）、顶部版本号可见；只用演示数据、无 PII/私密 | docs/33-README-SCREENSHOTS.md:24-25 | 需人工走查 |
| 33.4 | 一张图只讲一个功能，图下一句患者语言"回答什么" | docs/33-README-SCREENSHOTS.md:26 | 需人工走查 |
| 33.5 | README 固定五段：名称/定位+不做声明 → 关键功能 → 怎么用 → 数据与口径 → 开发 | docs/33-README-SCREENSHOTS.md:29-36 | 无 |

## 十一、AI 一键发送（34 号）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| 34.1 | 入口是 `<app>:agent-draft?prompt=…` 协议链接且点击 `preventDefault` | docs/34-AGENT-DRAFT-SEND.md:10 | templates/check-agent-draft-bridge.mjs A1 |
| 34.2 | 嵌入式（`window.parent!==window`）必须 `parent.postMessage({type:'<app>:agent-draft',prompt,send:true})`；`file://` 独立打开只有本地演示并明说未接通 | docs/34-AGENT-DRAFT-SEND.md:11 | check-agent-draft-bridge.mjs A1 |
| 34.3 | 壳层监听同类型消息，同时校验 `event.source===iframe.contentWindow` 与同源 origin，prompt 截断 ≤8000 | docs/34-AGENT-DRAFT-SEND.md:13,37 | check-agent-draft-bridge.mjs A2 |
| 34.4 | 自动发送双守卫：重取 snapshot，仅 `phase==='plain'` 且草稿非空才 `input.submit?.()`，异常不外抛 | docs/34-AGENT-DRAFT-SEND.md:14,20,38 | check-agent-draft-bridge.mjs A3 |
| 34.5 | 嵌入式中业务自有演示面板整体隐藏，不允许"演示面板+原生会话"双面板；门控要落在面板显隐函数体内 | docs/34-AGENT-DRAFT-SEND.md:12,39 | check-agent-draft-bridge.mjs A4 |
| 34.6 | 草稿冲突追加不覆盖；私密默认不进上下文；草稿不带本机资料目录路径/用户名 | docs/34-AGENT-DRAFT-SEND.md:23,27,30 | 无 |
| 34.7 | 回退"只填不发"属产品变更，须 CHANGELOG + 交互设计修订段留授权依据，不许实现里悄悄改 | docs/34-AGENT-DRAFT-SEND.md:43 | 无 |

## 十二、页面版本字面量（35 号）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| 35.1 | `public/index.html` 里 `vX.Y.Z` 字面量为 0（占位符约定），或全部等于 `VERSION`（字面量约定） | docs/35-PAGE-VERSION-LITERAL.md:19-38,55 | templates/check-version-literal.mjs |
| 35.2 | 页面完全不显示版本 = 失败（用户看不出装的是哪版） | docs/35-PAGE-VERSION-LITERAL.md:51 | 同上 |
| 35.3 | 有占位符但残留写死版本/日期 = 失败并带行号；升版后打开界面确认版本真的变了 | docs/35-PAGE-VERSION-LITERAL.md:48,57 | check-version-literal + 注入单测（模板提及 test/version-inject，仓内无） |
| 35.4 | 闸门自身要留痕：把某处改回旧版本号，确认闸门变红 | docs/35-PAGE-VERSION-LITERAL.md:58 | 需人工走查（或脚本 --self-test） |
| 40.14 | 四处同值：`VERSION`/package.json/lib/version.js/public 显现值；`build-client --check` 无 `__AGENT_MIN__` 残留 | docs/40-A-FAMILY-PANEL-STANDARD.md:496-508,484 | check-conformance.mjs `version/*` + check-version-literal |

## 十三、疾病概要（36 号 P1–P9、L1–L13）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| P1 | 顶栏有可点「?」，`aria-label` 说明四段内容 | docs/36-DISEASE-PRIMER.md:264 | scripts/probe-disease-primer.mjs P1 |
| P2 | 点击出现整页面板，四段标题齐全且顺序 定义→指南→治疗全景→趋势 | docs/36-DISEASE-PRIMER.md:265 | probe-disease-primer.mjs P2 |
| P3 | 面板可见区宽高 ≥ 视口 90%（是整页不是弹窗） | docs/36-DISEASE-PRIMER.md:266 | probe-disease-primer.mjs P3 |
| P4 | 打开多一条 history 记录；`history.back()` 后面板收起 | docs/36-DISEASE-PRIMER.md:267 | probe-disease-primer.mjs P4 |
| P5 | 「返回」与「关闭」是两个独立可见入口 | docs/36-DISEASE-PRIMER.md:268 | probe-disease-primer.mjs P5 |
| P6 | 关闭后焦点回触发按钮、页面滚动位置不变 | docs/36-DISEASE-PRIMER.md:269 | probe-disease-primer.mjs P6 |
| P7 | Esc 只退一层（不刷新、不离开页面） | docs/36-DISEASE-PRIMER.md:270 | probe-disease-primer.mjs P7 |
| P8 | 四段齐全；趋势段不含 15 个禁止词（有望/即将/前景/…/里程碑） | docs/36-DISEASE-PRIMER.md:271 | probe P8 + check-conformance `primer/趋势段` |
| P9 | 正文/列表/来源行同左基线（≤1px）、右边界极差 ≤2px；表格须有 `overflow-x:auto`；1440/900/390 三档 | docs/36-DISEASE-PRIMER.md:252-258,272 | probe-disease-primer.mjs P9 |
| 36-2.2 | 治疗全景段末必须有固定出口原话（肿瘤/非肿瘤二选一），且口径写进 `docs/SPEC.md`；不得自创第三句 | docs/36-DISEASE-PRIMER.md:108-112 | templates/check-primer-links.mjs:137-156（L13） |
| 36-2.3 | 趋势段只写五类已发生事实，每类带日期或版本号；只报数量与阶段，不写"即将上市" | docs/36-DISEASE-PRIMER.md:116-129 | probe P8 + check-conformance |
| 36-2.4 | 来源行固定格式「机构 · 文件名+版本（日期）· 原件状态 · 页码」；未取得原件写"未取得原件，据二次来源"；页码不明写"页码待核" | docs/36-DISEASE-PRIMER.md:133-141 | check-primer-links L3/L4 |
| 36-2.5 | `original:true` 必带 `kind`（pdf/fulltext/registry/dataset）；`kind:'hub'` 不得 `original:true` | docs/36-DISEASE-PRIMER.md:46-51,82-84 | check-primer-links.mjs L7/L8/L9 |
| 36-2.5b | 缺链接行渲染红色「缺链接，违反 36 号 §2.5」；`href` 只接受 `https://` | docs/36-DISEASE-PRIMER.md:68-69 | 无（L5/L6 只查数据，不查渲染） |
| 36-2.5c | `entry:true` 必带 `note` + https 链接，渲染「官方入口 ↗ 需自行注册」，不得写「已取得」 | docs/36-DISEASE-PRIMER.md:53-63,87 | check-primer-links.mjs L12 |
| 36-3.1 | README 有 `## 疾病概要`，位置在简介后、开发顺序前，四段正文齐全 | docs/36-DISEASE-PRIMER.md:148-154 | check-conformance.mjs `primer/README` |
| 36-3.2 | 看板顶栏「?」打开整页；数据来自 `window.DISEASE_PRIMER`，与 README 同源、四段标题一致 | docs/36-DISEASE-PRIMER.md:156-162 | check-conformance `primer/入口` + probe P2 |
| 36-3.3 | 不用 `<dialog>`：自带 overlay，open `pushState`、close `history.back()` | docs/36-DISEASE-PRIMER.md:164-168 | probe P4 |
| 36-4.3 | 正文块不设 `max-width`；列表缩进移到 `li`；表格 `min-width:640px` + 容器横滚；项目选择器必须限定作用域 | docs/36-DISEASE-PRIMER.md:239-250 | probe P9 |

## 十四、A 家族面板（40 号）

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| A40-1 | DOM 顺序 `business → splitter → shield → aside`（splitter 在 aside 之前）；根节点首个子元素是语义 `<header>` | docs/40-A-FAMILY-PANEL-STANDARD.md:29-38,526 | 40:456-460 `indexOf(separator) < indexOf(aside)` 断言；header 首子元素需另查 |
| A40-2 | splitter 视觉 1px、`marginRight:-0.5`，热区子元素 `left:-5;width:11`，不占布局宽 | docs/40-A-FAMILY-PANEL-STANDARD.md:265-277,527 | 40:462 的 grep 断言 |
| A40-3 | 拖动遮罩 `dragging && !narrow` 渲染，`inset:0;zIndex:4`（无遮罩指针掠过 iframe 会断拖） | docs/40-A-FAMILY-PANEL-STANDARD.md:352-357,528 | 40:465 grep |
| A40-4 | 悬停 6px/拖动 10px 品牌色光晕；`SPLITTER_BRAND` 只出现一次并由 `rgba()` 派生 | docs/40-A-FAMILY-PANEL-STANDARD.md:282-293,536 | 40:468 grep |
| A40-5 | 参数 `AGENT_MIN/MAX/STEP` 由 `lib/layout.js` 注入（25/45/2%，默认 35） | docs/40-A-FAMILY-PANEL-STANDARD.md:318-328 | 40:471 grep + check-conformance |
| A40-6 | 拖动按 body `getBoundingClientRect()` 夹取，不用 `window.innerWidth`；`setPointerCapture` 为加速项、document 监听兜底 | docs/40-A-FAMILY-PANEL-STANDARD.md:317,360-375,533 | 40:474-475（含反向警告） |
| A40-7 | 窄容器 <760px 用覆盖抽屉 `width:min(92%,420px)`，不渲染 splitter/遮罩，`ResizeObserver` 判容器宽 | docs/40-A-FAMILY-PANEL-STANDARD.md:379-389,535 | 无（需 DOM 断言） |
| A40-8 | splitter `role=separator` + `aria-valuemin/max/now` + `tabIndex=0`；← 加宽/→ 收窄 2%，Home/End 到 45%/25% | docs/40-A-FAMILY-PANEL-STANDARD.md:333-347 | 无（需 DOM 断言） |
| A40-9 | 会话恒挂载只切 `display`/`paneOpen`，收起不结束会话、不丢草稿 | docs/40-A-FAMILY-PANEL-STANDARD.md:139,244,532 | check-conformance `panel/会话区常挂载`（静态） |
| A40-10 | 用 `currentSession()`+`ownsSession()` 判"有会话"，不用 `Boolean(conversation)`；订阅后重算 | docs/40-A-FAMILY-PANEL-STANDARD.md:147-172,531 | check-conformance `panel/会话归属`（静态 warn） |
| A40-11 | 顶栏五态文案逐字固定：`AI 对话`/`正在连接…`/`收起 AI 对话`/`打开 AI 对话`/`AI 对话暂不可用`，另有独立「×」；面板内无第二组开合控件 | docs/40-A-FAMILY-PANEL-STANDARD.md:243-255 | 无（静态 grep 五字符串可写） |
| A40-12 | 面板壳字号 12.5/11/11.5、header padding `6px 12px`、主按钮 `5px 14px` 圆角 999；大字用 `--tz` 但 chip/说明不得放大超一档 | docs/40-A-FAMILY-PANEL-STANDARD.md:397-425,405 | 无（静态 grep 可写） |
| A40-13 | 面板令牌走本仓品牌色，不写死蓝色；SVG 内字号 ≥10px，末点标签 11px | docs/40-A-FAMILY-PANEL-STANDARD.md:429-444 | 无（grep 蓝色/字号可写） |
| A40-14 | 8 秒兜底定时器必须在 `onLoad` 里 `clearTimeout`（否则加载完 8 秒被兜底页替换） | docs/40-A-FAMILY-PANEL-STANDARD.md:120,538 | 无（静态可查 clearTimeout） |
| A40-15 | 静态断言 ①–⑥ 全绿；`npm test` 0 fail；`npm run check` exit 0 且链含 `build-client --check`/`check-host-contract`/`smoke-activate`/`check-version-literal` | docs/40-A-FAMILY-PANEL-STANDARD.md:454-484 | check-host-contract.mjs、smoke-activate.mjs、check-version-literal.mjs |
| A40-16 | 参数侧 `assertPanelConfig()`：`businessWidth ∈ 0.25–0.7` 且 ≠0.7、`customFrame===true`、`min<def<max`、`max≤0.45` | docs/40-A-FAMILY-PANEL-STANDARD.md:478 | check-host-contract.mjs + check-conformance |

## 十五、AGENTS.md 与交付闸口

| 编号 | 规则（可执行的一句话） | 出处 file:line | 现有检查手段 |
| --- | --- | --- | --- |
| AG-1 | 新项目交付前跑 `dsh-wb-cli audit <项目目录>`，fail 不交付；warn 逐条回「已人工确认/确实没有」 | AGENTS.md:82 | scripts/check-conformance.mjs（audit 同源） |
| AG-2 | 版本号必须同时出现在 HTML 原型首页与装机后应用首页首屏，且与 package.json/tag/市场条目一致 | AGENTS.md:43 | check-version-literal + check-conformance `version/*` |
| AG-3 | 只认 DSH Desktop 的 profile；`~/.dsh/profiles/*` 与 `com.deepseek.dsh` 不算交付；没装就停下给安装包 | AGENTS.md:11-27 | project-template/scripts/check-install.mjs |
| AG-4 | 正式业务开发前必须先交付可打开、可点击的 HTML 原型并由用户确认版本/hash 与范围 | AGENTS.md:111-113 | 无（确认记录人工） |
| AG-5 | 编码前先读最新线上开发规范；读不到要明说"未核对最新规范" | AGENTS.md:30 | 需人工走查 |
| AG-6 | 业务页无会话时也可用（不把常驻会话区当默认设计）；原生会话面板默认右侧，不得覆盖成"左侧对话+右侧业务" | AGENTS.md:74,88 | 无 |

## 结尾一：现有脚本已覆盖的条目编号

- `scripts/probe-page-view.mjs`（A1–A10 + L3，`--self-test` 反向对照）：A1–A10、32-L3；间接覆盖 32-4（A3）。
- `scripts/probe-disease-primer.mjs`（P1–P9，`--self-test`）：P1–P9、36-3.3（P4）、36-3.2（P2）。
- `templates/check-primer-links.mjs`（L1–L13 静态 + `--http` L10/L11）：36-2.4（L3/L4）、36-2.5（L7/L8/L9）、36-2.5c（L12）、36-2.2（L13，脚本 :137-156）。
- `templates/check-agent-draft-bridge.mjs`（A1–A4）：34.1–34.5、20.6（A4）、IP10（反向：断言发送而非"不发送"）。
- `templates/check-version-literal.mjs`：35.1、35.2、35.3、AG-2、40.14。
- `templates/check-choice-limit.mjs`：19.5、16-5（仅 checkbox 上限形态）。
- `templates/check-host-contract.mjs` + `scripts/check-conformance.mjs`：20.2（部分）、20.3、A40-16、AG-1、AG-2、AG-3（`panel/*`、`version/*`、`check/*`）。
- `templates/check-static-refs.mjs`、`check-render-after-write.mjs`、`check-dialog-handoff.mjs`、`check-ctx-provide.mjs`、`check-medical-threshold.mjs`、`check-trial-matching.mjs`、`check-trial-snapshot.mjs`、`check-derivative-leftovers.mjs`、`check-workbench-package.mjs`、`check-starter.mjs`：分别覆盖静态引用、写后渲染、弹窗交接、ctx 白名单、体温阈值函数、试验匹配、试验快照、移植残留、包结构、starter 自检（与本清单编号多为间接关系，不逐条对应）。
- 40 号 §5.1 的 ①–⑥ 是一组**可直接执行**的 `node -e`/`grep` 断言：A40-1、A40-2、A40-3、A40-4、A40-5、A40-6。

## 结尾二：只有文档、没有检查器的条目编号

C1–C12 全部、16-0.2a、16-0.2b、16-2.1、16-3、16-7、19.1–19.4、19.6–19.10、20.1、20.4、20.5（仅文档内 grep 片段）、20.6（仅 A4 间接）、20.8、20.9、M1–M2、M3b–M11（M3 仅体温/阈值函数形态）、24-5a–24-5d、MT01–MT14（MT15 只有签认表）、27.1–27.12、IP1–IP9、IP11、X1–X4、30.1–30.9、32-3、32-5、32-file、32F-1–32F-5、33.1–33.5（33 号点名的 `check-readme-assets.mjs` 仓内不存在）、34.6、34.7、35.4、36-2.3（仅禁止词扫描）、36-2.5b、36-3.1（conformance 已覆盖，但无渲染检查）、36-4.3（P9 覆盖对齐，不覆盖 CSS 作用域泄漏）、A40-7、A40-8、A40-11–A40-14、AG-4–AG-6。

> 说明：C1–C12、MT01–MT15、IP1–IP11 目前都只有「模板签认行」或「文档判据」，没有随仓可执行的断言脚本；A1–A10、P1–P9、34 号 A1–A4、35 号闸门是仅有的四组已脚本化条目。

## 结尾三：建议补成断言的 3–5 条

1. **C1/C11（一图秀归一化与翻转几何）** —— 写 `scripts/probe-one-chart.mjs`：对每个含 `.chart` 的一级页，取两条量纲差异大的序列 `path.getBBox()`，断言 `max(h)/min(h) < 1.1`；再对每张 `.mcard` 记录翻转前后的 `getBoundingClientRect()` 四值全等、`getComputedStyle(inner).transform` 以 `matrix3d` 开头。断言前先断言 path 数与 bbox 高度 >0（防"空值恒等"假绿，见 `check-assertion-strength.mjs`）。
2. **C2/C3/C4（单点/空态/治疗条分层）** —— 同一探针内：构造只有 1 条记录的 fixture，断言该序列 `path` 数=0、`circle` 数=1、含"只有 1 次记录"文案；构造窗口内 0 点，断言文本含"没有所选指标"且 `svg` 子节点非空；记录切换治疗节点前后所有 `path.getAttribute('d')` 字符串数组，断言逐项相等且数组非空。
3. **MT07/MT08（3D 卡翻转）** —— `scripts/probe-metric-cards.mjs`：点击卡 A 断言 `aria-pressed=true`、卡 B 仍 false、页面 `scrollY` 与卡 A 的 `rect` 不变；断言隐藏面 `[inert]` 或 `aria-hidden=true`，且 `document.activeElement` 不在隐藏面内；Tab 遍历断言不可聚焦隐藏面元素；用 CDP `Emulation.setEmulatedMedia` 模拟 reduced-motion，断言 `transform` 直接为最终 `matrix3d`。
4. **A40-7/A40-8（A 家族面板）** —— 在 `smoke-activate.mjs` 或新 `probe-panel.mjs` 里：把容器缩到 759px，断言 `aside` 宽 = `min(92%,420)`、`[role=separator]` 节点数为 0、遮罩不存在；恢复 1000px，对 separator 发 `ArrowLeft` 5 次断言 `aria-valuenow` 每次 +2 且夹在 25–45，`Home`=45、`End`=25；再断言 `document.querySelectorAll('[role=separator]').length===1`（防双入口）。
5. **34.6 + 36-2.5b（内容红线，纯静态即可）** —— 扩 `check-agent-draft-bridge.mjs`：断言 `postMessage` 的 prompt 构造不含 `path`/用户名变量（grep `home`/`user` 拼接），私密字段名出现处必须有 `includePrivate` 门控；扩 `check-primer-links.mjs`：断言渲染层存在"缺链接，违反 36 号 §2.5"字符串且只在 `!url && !secondaryUrl && !entry` 分支出现（防"标记写了但永不触发"）。