/* 由 scripts/build-client.mjs 从 src/client.js 生成，勿手改。 */
/* 面板参数来自 lib/layout.js，版本来自 lib/version.js（VERSION 派生）。 */
window.__ModuleLoader__.load({
  id: "@xyb-community/primary-immunodeficiency-workbench",
  factory(require) {
    const React = require('react')
    /* 注入点：与 lib/layout.js 同源，客户端不许另写一份 0.65 */
    const __PANEL_LAYOUT__ = {"customFrame":true,"businessSide":"left","businessWidth":0.65,"businessWidthMin":0.55,"businessWidthMax":0.7}
    /* 会话面板参数（默认/最小/最大/步进）同源于 lib/layout.js */
    const __AGENT_PANE__ = {"default":0.35,"min":0.25,"max":0.45,"hideable":true,"resizable":true}
    const __VERSION__ = "0.2.0"

    /**
     * 宿主接线件 ③：DSH Desktop 工作台客户端外壳（家族 rc.46 面板契约，字符串换 PID/小御宝）。
     *
     * 家族口径：客户端插件只做「入口 + 装界面 + 连接状态」，**不重画业务界面**——
     * 业务界面全部来自 `public/`，由 iframe 装进面板。这样原型、dev-server、装机三处
     * 看到的是同一份 HTML/CSS/JS，不会出现"开发版一套、装机另一套"。
     *
     * 面板形态（家族 2026-10-21 实机反馈后统一）：`customFrame: true` 自绘外壳。
     * 宿主把原生会话节点作为 `conversation` prop 交给我们排版：
     * - 顶栏有「AI 对话 / 收起」按钮；splitter 可拖/键盘调（25%–45%，步进 2%）；
     * - 收起只隐藏不结束会话；宽度存 localStorage；容器窄于 760px 改覆盖式抽屉；
     * - 原生会话**始终挂载**（只用 display 控显隐）——卸载会丢输入框状态。
     *
     * 本文件由 `scripts/build-client.mjs` 打包成 `lib/client.js`（宿主加载的就是后者）。
     * 面板参数不在这里手写第二份：layout 与 AGENT_PANE 由构建时从 lib/layout.js 注入。
     *
     * 本仓策略不变：草稿只填入、**不自动发送**（页面里的 agent-draft 契约同样只填不发）。
     */

    const UI_ENTRY = '/primary-immunodeficiency/'
    const HEALTH_URL = '/api/primary-immunodeficiency/api/health'
    const DATA_ROOT_URL = '/api/primary-immunodeficiency/api/root'
    /* 资料目录口径（与服务端 checkDataDir 同一条规则；服务端会再判一遍）：
       主目录本身 / 桌面 / 下载根目录 / tmp 一律不当资料目录。源码目录也不是资料目录。 */
    const HOME_EXACT = /^(\/Users\/[^/]+|\/home\/[^/]+|\/root|[A-Za-z]:\\Users\\[^\\]+)$/i
    const FORBIDDEN_DIR = /((Desktop|桌面)$|(Downloads?|下载(夹)?)$|^(\/tmp|\/private\/tmp|\/var\/folders\/|\/private\/var\/folders\/))/i
    const isForbiddenDir = (dir) => HOME_EXACT.test(dir) || FORBIDDEN_DIR.test(dir)

    const META = {
      title: '小御宝 ImmuPal · 原发性免疫缺陷病工作台',
      panelTitle: '小御宝 · 原发性免疫缺陷病工作台',
      icon: '御',
      repository: 'https://github.com/xyb-openharness-dsh-plugins/primary-immunodeficiency-workbench',
      description: '本机优先的原发性免疫缺陷病（PID）感染事件档案、IVIG 替代治疗按次记录、免疫球蛋白水平可比组展示、预防性用药与接种口径登记、复诊准备工作台（合成演示）',
      audience: '原发性免疫缺陷病患者与授权代记者',
      requirements: '本机数据整理；不做诊断、不分型、不给处置建议、不做病情判定，判断由用户与其医生做出。',
      author: '小御宝社区贡献者（品牌占位名待晨审追认）',
    }

    const CLIENT_NAME = 'primary-immunodeficiency-workbench'
    const INJECT = ['desktopWorkbenches', 'sessions']

    /* 等待 iframe 首次 load 的宽限：宿主刚重启时插件可能还没就绪，过早报错会吓人 */
    const LOAD_GRACE_MS = 8000

    /* 宿主不提供新建会话能力时，将原因显示在工作台顶栏 */
    const NO_SESSION_CAPABILITY_NOTE = '当前 Desktop 版本不支持从面板调起会话；请从左侧会话列表新建会话'

    /* 会话面板参数：由 scripts/build-client.mjs 从 lib/layout.js 的 AGENT_PANE 注入 */
    const AGENT = __AGENT_PANE__
    const AGENT_DEFAULT = Number(AGENT.default)
    const AGENT_MIN = Number(AGENT.min)
    const AGENT_MAX = Number(AGENT.max)
    const AGENT_STEP = Number(AGENT.step || 0.02)
    const NARROW_BELOW = 760
    const DRAWER_MAX = 520
    const WIDTH_KEY = 'primary-immunodeficiency.agent-pane.v1'
    const DRAFT_KEY = 'primary-immunodeficiency.agent-drafts.v1'

    const clampWidth = (value) => {
      const n = Number(value)
      if (!Number.isFinite(n)) return AGENT_DEFAULT
      return Math.min(AGENT_MAX, Math.max(AGENT_MIN, n))
    }
    const snapWidth = (value) => clampWidth(Math.round(value / AGENT_STEP) * AGENT_STEP)
    const round4 = (n) => Math.round(n * 10000) / 10000

    function loadWidth() {
      try {
        const saved = JSON.parse(localStorage.getItem(WIDTH_KEY) || 'null')
        return clampWidth(saved?.width)
      } catch { return AGENT_DEFAULT }
    }
    function saveWidth(width) {
      try { localStorage.setItem(WIDTH_KEY, JSON.stringify({ width: round4(width) })) } catch { /* 隐私模式忽略 */ }
    }

    /* ---------------- 样式（小御宝陶土主色，配米白底） ---------------- */

    const rootStyle = {
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0,
      position: 'relative', width: '100%', maxWidth: '100%', boxSizing: 'border-box',
      background: '#f7faf8', font: '12.5px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif',
      color: '#596c62',
    }
    // 首个子元素必须是语义 <header>：宿主为 macOS 窗口按钮预留了 --dsh-frame-leading-clearance。
    const headerStyle = {
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
      paddingInlineStart: 'calc(14px + var(--dsh-frame-leading-clearance, 0px))',
      borderBottom: '1px solid #dce7df', background: '#fff', flex: '0 0 auto', flexWrap: 'wrap',
    }
    const hintStyle = {
      flex: '1 1 auto', minWidth: 120, marginInlineStart: 8, color: '#8fa39b', fontSize: 11.5,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }
    const bodyStyle = { position: 'relative', display: 'flex', flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }
    const businessStyle = { flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }
    const frameStyle = { flex: '1 1 auto', width: '100%', minHeight: 0, border: 0, display: 'block', background: '#f7faf8' }
    const paneStyle = {
      display: 'flex', flexDirection: 'column', flex: '0 0 auto', minWidth: 0, minHeight: 0,
      borderLeft: '1px solid #dce7df', background: '#fff', overflow: 'hidden',
    }
    const drawerStyle = {
      position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 3,
      boxShadow: '-8px 0 24px rgba(52, 65, 60, 0.18)',
    }
    /* 分隔线：1px 常规线条，绝对定位在业务区/会话边界上，不占布局宽度。 */
    const splitterStyle = {
      position: 'absolute', top: 0, bottom: 0, width: 1, marginRight: -0.5,
      zIndex: 2, background: '#dce7df', cursor: 'col-resize', touchAction: 'none',
      transition: 'background .15s ease, box-shadow .15s ease',
    }
    const SPLITTER_BRAND = '#b95023'
    const splitterRgba = (hex, alpha) => {
      const n = parseInt(String(hex).replace('#', ''), 16)
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
    }
    const splitterHoverStyle = {
      ...splitterStyle,
      background: SPLITTER_BRAND,
      boxShadow: `0 0 6px ${splitterRgba(SPLITTER_BRAND, 0.55)}`,
    }
    const splitterDragStyle = {
      ...splitterHoverStyle,
      boxShadow: `0 0 10px ${splitterRgba(SPLITTER_BRAND, 0.8)}`,
    }
    const splitterHitStyle = {
      position: 'absolute', top: 0, bottom: 0, left: -5, width: 11,
      background: 'transparent', cursor: 'col-resize',
    }
    const splitterGripStyle = {
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      width: 14, height: 22, borderRadius: 4, background: SPLITTER_BRAND,
      color: '#fff', fontSize: 11, lineHeight: '22px', letterSpacing: '-1px', textAlign: 'center',
      opacity: 0.95, pointerEvents: 'none', userSelect: 'none',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.18)',
    }
    const dragShieldStyle = {
      position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 4,
      cursor: 'col-resize', background: 'transparent', touchAction: 'none',
    }
    const buttonStyle = {
      minHeight: 30, border: 0, borderRadius: 999, padding: '5px 12px', whiteSpace: 'nowrap',
      background: '#b95023', color: '#fff', font: 'inherit', fontWeight: 600, cursor: 'pointer',
    }
    const ghostStyle = {
      ...buttonStyle, background: 'transparent', color: '#b95023', border: '1px solid #e3cbbd',
    }
    const padStyle = {
      display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center',
      padding: 20, color: '#596c62', fontSize: 12.5, lineHeight: 1.75,
    }
    const loadingStyle = {
      position: 'absolute', inset: '38px 0 0', display: 'grid', placeItems: 'center',
      color: '#596c62', font: '13px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif',
    }

    function buildPanel(React, layout, host) {
      const h = React.createElement
      const { useState, useEffect, useRef } = React
      const service = host?.desktopWorkbenches

      /* ---------------- 会话归属（与家族其它工作台同一套判定） ---------------- */

      function currentSession() {
        if (typeof service?.currentSession === 'function') return service.currentSession() || null
        const snapshot = host?.sessions?.list?.getSnapshot?.()
        return snapshot?.current || Object.keys(snapshot?.byId || {}).find((id) =>
          (snapshot.byId[id]?.retainedBy?.mainView ?? 0) > 0) || null
      }
      function workbenchOwnsSession(sessionId) {
        if (!sessionId) return false
        return typeof service?.ownsSession === 'function' ? Boolean(service.ownsSession(sessionId)) : false
      }
      function ownedSession() {
        const id = currentSession()
        return workbenchOwnsSession(id) ? id : null
      }

      /* ---------------- 原生草稿：只填不发 ---------------- */

      function appendDraft(sessionId, prompt) {
        if (!sessionId || ownedSession() !== sessionId) throw new Error('会话已切换，请回到本工作台再操作')
        const scoped = host.sessions.scope?.(sessionId)
        const conversation = scoped?.get?.('conversation')
        if (!conversation) throw new Error('对话输入不可用')
        const input = conversation.input.for(scoped)
        const snapshot = input.state.getSnapshot()
        if (snapshot.occurrences?.length || (snapshot.phase && snapshot.phase !== 'plain')) {
          throw new Error('当前草稿含引用或正在提交，请先在原生会话里处理')
        }
        const current = snapshot.draft || ''
        input.setDraft(current.trim() ? `${current}\n\n${prompt}` : prompt)
      }

      let pendingDraft = null
      try {
        const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
        if (saved?.sessionId && saved?.prompt) pendingDraft = saved
      } catch { /* 隐私模式忽略 */ }
      function rememberDraft(entry) {
        pendingDraft = entry
        try {
          if (entry) localStorage.setItem(DRAFT_KEY, JSON.stringify(entry))
          else localStorage.removeItem(DRAFT_KEY)
        } catch { /* 隐私模式忽略 */ }
      }
      function flushDraft() {
        if (!pendingDraft) return false
        try {
          appendDraft(pendingDraft.sessionId, pendingDraft.prompt)
          rememberDraft(null)
          return true
        } catch { return false /* composer 未就绪：留到下一轮 */ }
      }

      function onboardingPrompt() {
        return [
          '你正在协助我使用「小御宝原发性免疫缺陷病工作台」。它只整理本机资料，不做诊断、不分型、不给处置建议、不做病情判定。',
          '里面是我自己记录的感染事件经过、免疫球蛋白替代治疗（IVIG/SCIG）按次登记、免疫球蛋白与淋巴细胞亚群化验、预防性用药与医生接种口径、复诊问题清单。',
          '分工：你帮我汇总已记录的内容、指出缺项；判断和处置由我和我的医生决定。',
          '没有记录的项请写“没有”，不要补写或推测；标了私密的内容不要复述。',
        ].join('\n')
      }

      return function Panel({ conversation }) {
        const [phase, setPhase] = useState('loading')   // loading | ready | broken
        const [version, setVersion] = useState('')
        const [detail, setDetail] = useState('')
        const [attempt, setAttempt] = useState(0)
        const [width, setWidth] = useState(loadWidth)
        const [paneOpen, setPaneOpen] = useState(true)
        const [connecting, setConnecting] = useState(false)
        const [narrow, setNarrow] = useState(false)
        const [dragging, setDragging] = useState(false)
        /* 资料目录：面板里显示当前真实落点，并支持换一个（真调宿主选择器） */
        const [dataDir, setDataDir] = useState('')
        const [dirNote, setDirNote] = useState('')
        const [hovering, setHovering] = useState(false)
        const [note, setNote] = useState('')
        const [, setSessionRevision] = useState(0)

        const timer = useRef(null)
        const shellRef = useRef(null)
        const dragHostRef = useRef(null)
        const frameRef = useRef(null)
        const creatingRef = useRef(false)

        // customFrame 下宿主始终传 conversation 容器；无会话时只是 display:none。
        // 用归属服务判断当前工作台是否真的有会话，不能用 prop 是否为真值。
        const activeSession = ownedSession()
        const hasConversation = Boolean(activeSession)
        const canOpenSession = typeof service?.newSession === 'function'

        useEffect(() => {
          setPhase('loading'); setDetail('')
          const controller = new AbortController()
          fetch(HEALTH_URL, { signal: controller.signal, credentials: 'same-origin' })
            .then(async (response) => {
              if (!response.ok) throw new Error(`服务连接失败 (${response.status})`)
              return response.json()
            })
            .then((health) => { if (!controller.signal.aborted) setVersion(health.version || '') })
            .catch((failure) => {
              if (controller.signal.aborted) return
              setDetail(failure.message)
              setPhase('broken')
            })
          timer.current = setTimeout(() => {
            setPhase((current) => (current === 'loading' ? 'broken' : current))
            setDetail((d) => d || '页面加载超时')
          }, LOAD_GRACE_MS)
          return () => { controller.abort(); clearTimeout(timer.current) }
        }, [attempt])

        // 挂载后消化未送达的草稿（composer 就绪一轮一次），并订阅会话变化。
        useEffect(() => {
          const interval = setInterval(() => { if (flushDraft()) setNote('草稿已填入会话，按回车发送') }, 500)
          const unsubscribe = service?.subscribe?.(() => {
            setSessionRevision((revision) => revision + 1)
            setNote('')
          })
          return () => { clearInterval(interval); unsubscribe?.() }
        }, [])

        // 窄屏判定用**容器宽度**而不是窗口宽度：宿主主区宽度不等于窗口宽度（合同基线）。
        useEffect(() => {
          const node = shellRef.current
          if (!node || typeof ResizeObserver !== 'function') return undefined
          const observer = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect?.width ?? 0
            setNarrow(w > 0 && w < NARROW_BELOW)
          })
          observer.observe(node)
          return () => observer.disconnect()
        }, [])

        const applyWidth = (next) => {
          const snapped = round4(snapWidth(next))
          setWidth(snapped)
          saveWidth(snapped)
        }

        const stopDrag = () => {
          dragHostRef.current = null
          setDragging(false)
        }

        useEffect(() => {
          if (!dragging) return undefined
          const onMove = (event) => {
            const rect = dragHostRef.current?.getBoundingClientRect?.()
            if (!rect?.width) return
            // 会话在右侧：指针越靠左，会话越宽
            applyWidth((rect.right - event.clientX) / rect.width)
          }
          document.addEventListener('pointermove', onMove)
          document.addEventListener('pointerup', stopDrag)
          document.addEventListener('pointercancel', stopDrag)
          return () => {
            document.removeEventListener('pointermove', onMove)
            document.removeEventListener('pointerup', stopDrag)
            document.removeEventListener('pointercancel', stopDrag)
          }
        }, [dragging])

        const onSplitterPointerDown = (event) => {
          event.preventDefault()
          try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* 旧宿主无指针捕获：document 监听仍可拖动 */ }
          dragHostRef.current = shellRef.current
          setDragging(true)
        }

        const onSplitterKeyDown = (event) => {
          const delta = { ArrowLeft: AGENT_STEP, ArrowRight: -AGENT_STEP }[event.key] // 会话在右：← 变宽
          if (delta !== undefined) { event.preventDefault(); applyWidth(width + delta); return }
          if (event.key === 'Home') { event.preventDefault(); applyWidth(AGENT_MAX); return }
          if (event.key === 'End') { event.preventDefault(); applyWidth(AGENT_MIN) }
        }

        /* ---- 打开 / 复用 AI 会话（不自动发送） ---- */

        async function openAgent(prompt = null) {
          setNote('')
          if (!canOpenSession) {
            setNote(NO_SESSION_CAPABILITY_NOTE)
            return
          }
          const existing = ownedSession()
          if (existing) {
            setPaneOpen(true)
            if (prompt) {
              rememberDraft({ sessionId: existing, prompt })
              setNote(flushDraft() ? '已填入会话草稿，按回车发送' : '会话输入框还没就绪；内容已暂存')
            }
            return
          }
          // 快速连点或业务页连发消息时，不能并发创建出两条会话。
          if (creatingRef.current) return
          creatingRef.current = true
          setConnecting(true)
          try {
            // 与当前已运行的工作台保持一致：复用当前默认工作区；宿主只在
            // 没有可用工作区时才提示选择目录，并负责创建、绑定和激活会话。
            let workspaceId
            try { workspaceId = service.defaultWorkspace?.()?.workspaceId } catch { workspaceId = undefined }
            const id = await service.newSession(workspaceId)
            if (!id) {
              setNote('已取消资料目录选择，没有创建会话。可以再次点击「AI 对话」重试。')
              return
            }
            setPaneOpen(true)
            rememberDraft({ sessionId: id, prompt: prompt || onboardingPrompt() })
            setNote(flushDraft()
              ? '会话已就绪：草稿已填入右侧输入框，按回车发送'
              : '会话已就绪；输入框就绪后草稿会自动填入')
          } catch (error) {
            setNote(`没能调起会话：${error?.message ?? error}。可以再次点击「AI 对话」重试。`)
          } finally {
            creatingRef.current = false
            setConnecting(false)
          }
        }

        function onAgentClick() {
          if (!hasConversation) { void openAgent(); return }
          setPaneOpen((open) => !open)
          setNote('')
        }

        async function deliverContext(prompt) {
          const id = ownedSession()
          if (id) {
            setPaneOpen(true)
            rememberDraft({ sessionId: id, prompt })
            setNote(flushDraft() ? '已填入会话草稿，按回车发送' : '会话输入框还没就绪；内容已暂存')
            return
          }
          await openAgent(prompt)
        }

        // 业务 iframe 只认「自己 + 同源」发来的消息；handler 每轮换最新闭包，effect 只注册一次。
        const deliverRef = useRef(null)
        deliverRef.current = deliverContext
        useEffect(() => {
          function onMessage(event) {
            const data = event.data
            if (!data || typeof data !== 'object') return
            if (!frameRef.current || event.source !== frameRef.current.contentWindow) return
            if (event.origin !== window.location.origin) return
            if (data.type === 'pid:agent-open') { void openAgent(); return }
            if (data.type !== 'pid:agent-draft') return
            const prompt = typeof data.prompt === 'string' ? data.prompt.trim() : ''
            if (prompt) void deliverRef.current?.(prompt.slice(0, 8000))
          }
          window.addEventListener('message', onMessage)
          return () => window.removeEventListener('message', onMessage)
        }, [])

        /* 当前资料目录：开面板读一次；换过之后立即回显 */
        useEffect(() => {
          let alive = true
          fetch(DATA_ROOT_URL, { credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : null))
            .then((info) => { if (alive && info && info.dir) setDataDir(info.dir) })
            .catch(() => { /* 读不到就不显示，别编一个路径 */ })
          return () => { alive = false }
        }, [attempt])

        /* 「配置目录」= 真入口：宿主选择器 → 口径校验 → 落盘 → 回显。
           「本原型为示意，目录未真实挂载」只允许出现在宿主没有选择能力的降级路径。 */
        async function pickDataDir() {
          const ui = host && host.uiWorkspace
          if (!ui || typeof ui.pickDirectory !== 'function') {
            setDirNote('本原型为示意，目录未真实挂载：当前 Desktop 没有提供目录选择能力，数据仍写在默认位置。')
            return
          }
          let dir = ''
          try { dir = await ui.pickDirectory() } catch (error) {
            setDirNote('没能打开目录选择器：' + ((error && error.message) || error))
            return
          }
          if (!dir) { setDirNote('已取消选择目录；当前资料目录没有更改。'); return }
          if (isForbiddenDir(dir)) {
            setDirNote('这个位置不能当资料目录（主目录本身 / 桌面 / 下载根目录 / tmp）。请在里面新建一个专用文件夹再选。')
            return
          }
          try {
            const rsp = await fetch(DATA_ROOT_URL, {
              method: 'POST', credentials: 'same-origin',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ dir }),
            })
            const body = await rsp.json().catch(() => ({}))
            if (!rsp.ok) { setDirNote(body.error || '目录切换失败'); return }
            setDataDir(body.dir || dir)
            setDirNote('资料目录已切换到：' + (body.dir || dir) + '（旧目录数据不会自动搬迁）')
          } catch (error) {
            setDirNote('目录切换失败：' + ((error && error.message) || error))
          }
        }

        const agentLabel = !canOpenSession
          ? 'AI 对话暂不可用'
          : connecting ? '正在连接…'
            : !hasConversation ? 'AI 对话'
              : paneOpen ? '收起 AI 对话' : '打开 AI 对话'
        // 能力缺失时的说明不能被会话订阅回调里的 setNote('') 冲掉：渲染期兜一层。
        const shownNote = dirNote || note || (canOpenSession ? '' : NO_SESSION_CAPABILITY_NOTE)

        if (phase === 'broken') {
          return h('main', {
            style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 12,
              justifyContent: 'center', alignItems: 'center', padding: 28, textAlign: 'center',
              font: '15px/1.7 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif', color: '#34413c' },
          },
            h('strong', { style: { fontSize: 17 } }, `工作台没能打开${version ? `（v${version}）` : ''}`),
            h('p', { role: 'status', style: { margin: 0, maxWidth: 520, color: '#596c62' } },
              detail || '页面没有加载成功。'),
            h('p', { style: { margin: 0, maxWidth: 560, color: '#596c62' } },
              '常见原因：Harness 刚重启、插件还没加载完，或还没有在本机新建会话（首次使用需要先建一个会话再回到工作台）。'),
            h('button', {
              type: 'button',
              onClick: () => { setAttempt((n) => n + 1) },
              style: { minHeight: 44, padding: '9px 20px', borderRadius: 999, border: 0,
                background: '#b95023', color: '#fff', cursor: 'pointer', font: 'inherit' },
            }, '重新加载'))
        }

        const percent = Math.round(width * 100)
        const paneVisible = paneOpen && (hasConversation || connecting)

        return h('main', { style: rootStyle },
          // 首个子元素必须是语义 <header>：避让 macOS 窗口按钮（--dsh-frame-leading-clearance）。
          h('header', { style: headerStyle },
            h('span', null, `${META.icon} ${META.panelTitle}`),
            h('span', { 'aria-hidden': true }, '·'),
            h('span', { 'aria-live': 'polite' }, version ? `v${version}` : '连接中'),
            h('span', { style: hintStyle, title: shownNote || '界面由 public/ 提供，与原型同源' },
              shownNote || '本机数据'),
            h('button', {
              type: 'button',
              style: ghostStyle,
              onClick: pickDataDir,
              'aria-label': dataDir ? `配置目录：当前 ${dataDir}` : '配置资料目录',
              title: dataDir ? `当前资料目录：${dataDir}` : '选择本机资料目录',
            }, dataDir ? '配置目录 · 已设' : '配置目录'),
            h('button', {
              type: 'button',
              style: buttonStyle,
              onClick: onAgentClick,
              disabled: connecting || (!hasConversation && !canOpenSession),
              'aria-label': `AI 对话：${agentLabel}`,
            }, agentLabel),
            hasConversation && paneOpen && h('button', {
              type: 'button', style: ghostStyle, onClick: () => setPaneOpen(false),
              'aria-label': '收起 AI 对话面板',
            }, '×')),
          h('div', { ref: shellRef, style: bodyStyle },
            h('div', { style: businessStyle },
              h('iframe', {
                key: attempt,
                ref: frameRef,
                src: UI_ENTRY,
                title: META.title,
                sandbox: 'allow-scripts allow-same-origin allow-forms allow-downloads',
                style: frameStyle,
                onLoad: () => { clearTimeout(timer.current); setPhase('ready') },
              })),
            // 分隔线夹在业务区与会话之间：放到 aside 之后会贴到面板最右缘，既不高亮也拖不动。
            !narrow && paneVisible && h('div', {
              role: 'separator',
              'aria-orientation': 'vertical',
              'aria-label': '调整 AI 对话面板宽度',
              'aria-valuemin': Math.round(AGENT_MIN * 100),
              'aria-valuemax': Math.round(AGENT_MAX * 100),
              'aria-valuenow': percent,
              tabIndex: 0,
              style: {
                ...(dragging ? splitterDragStyle : hovering ? splitterHoverStyle : splitterStyle),
                right: `${percent}%`,
              },
              onPointerDown: onSplitterPointerDown,
              onPointerEnter: () => setHovering(true),
              onPointerLeave: () => setHovering(false),
              onKeyDown: onSplitterKeyDown,
            },
              h('span', { style: splitterHitStyle, 'aria-hidden': 'true' }),
              (hovering || dragging) ? h('span', { style: splitterGripStyle, 'aria-hidden': 'true' }, '⠿') : null),
            // 原生会话**始终挂载**：隐藏走 display，不卸载（否则丢输入框与草稿状态）。
            h('aside', {
              style: {
                ...paneStyle,
                ...(narrow ? drawerStyle : null),
                width: narrow ? `min(92%, ${DRAWER_MAX}px)` : `${percent}%`,
                display: paneVisible ? 'flex' : 'none',
              },
              'aria-label': 'AI 对话',
              'aria-hidden': paneVisible ? undefined : 'true',
            }, hasConversation && conversation ? conversation : h('div', { style: padStyle },
              h('b', null, connecting ? '正在准备 AI 对话' : 'AI 对话还没开始'),
              h('span', null, connecting
                ? '宿主正在恢复会话或等待你选择资料目录。'
                : '点顶栏「AI 对话」创建或打开本工作台的原生会话。'),
              h('span', null, '没有会话也不影响记录：业务区的资料整理照常可用。'))),
            // 拖动遮罩：指针掠到业务 iframe 上时事件归子文档，遮罩让整块面板仍是我们的命中区。
            dragging && !narrow && h('div', { 'aria-hidden': 'true', style: dragShieldStyle })),
          phase === 'loading'
            ? h('div', { style: loadingStyle }, '正在打开工作台…')
            : null)
      }
    }

    function apply(ctx) {
      const layout = __PANEL_LAYOUT__
      const Panel = buildPanel(React, layout, ctx)
      ctx.effect(() => ctx.desktopWorkbenches.register({
        title: META.title,
        panelTitle: META.panelTitle,
        icon: META.icon,
        repository: META.repository,
        description: META.description,
        audience: META.audience,
        requirements: META.requirements,
        initialization: 'empty',
        embedded: true,
        version: __VERSION__,
        author: META.author,
        layout: { businessSide: layout.businessSide, businessWidth: layout.businessWidth },
        customFrame: layout.customFrame,
      }, Panel))
    }


    return { apply, inject: INJECT }
  }
})
