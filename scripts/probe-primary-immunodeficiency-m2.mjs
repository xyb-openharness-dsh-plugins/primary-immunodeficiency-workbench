/* 小御宝 M2 项目探针：对 prototypes/v0.2 真实浏览器断言（IP/C/MT/Q/A 组）
 * 通用铁律：先证明被测对象非空，再断言相等；SKIP 不计覆盖。
 * 全量路由探针：覆盖 ROUTES 全部叶子路由（与 check-probe-coverage.mjs 对账）。
 * 用法：node scripts/probe-primary-immunodeficiency-m2.mjs [--port N] [--url URL]
 * 依赖：puppeteer-core + 本机 Chrome（CHROME_PATH 可覆盖）。
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const args = process.argv.slice(2)
const argOf = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null }
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(argOf('--port') || 8141)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' }

/* 全量叶子路由（与 app.js 顶层 ROUTES 一一对应；漏一条 check-probe-coverage 就会红） */
const LEAF_ROUTES = ['dash', 'infections/list', 'infections/timeline', 'infusions/log', 'infusions/meds', 'labs/list', 'labs/chart', 'vaccine/log', 'vaccine/facts', 'visits/prep', 'visits/hospitals', 'reports/list', 'reports/wall', 'mind/feel', 'mind/family', 'records/archive', 'records/metrics', 'records/summary']

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ]
  return candidates.find(existsSync) || null
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (urlPath === '/favicon.ico') { res.writeHead(204); res.end(); return }
    const file = normalize(join(ROOT, urlPath))
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return }
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch { res.writeHead(404); res.end('not found') }
})

const results = []
function t(id, desc, pass, detail) {
  results.push({ id, desc, pass: !!pass, detail: detail === undefined ? '' : String(detail) })
  console.log((pass ? 'PASS ' : 'FAIL ') + id + '  ' + desc + (detail !== undefined ? '  — ' + JSON.stringify(detail).slice(0, 220) : ''))
}

const serverReady = new Promise(r => server.listen(PORT, '127.0.0.1', r))

async function main() {
  await serverReady
  const chrome = findChrome()
  if (!chrome) { console.log('FAIL env  找不到 Chrome：设置 CHROME_PATH 后重试。'); process.exit(2) }
  let puppeteer
  try {
    const famRequire = createRequire('/Users/qinxiaoqiang/.workbuddy/binaries/node/workspace/')
    puppeteer = famRequire('puppeteer-core')
  } catch {
    puppeteer = require('puppeteer-core')
  }
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()) })
  await page.setViewport({ width: 1280, height: 860 })
  const url = argOf('--url') || `http://127.0.0.1:${PORT}/prototypes/v0.2/index.html`
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__PID_APP__ && document.querySelectorAll('#nav button').length >= 9, { timeout: 5000 })

  /* ---------- IP2/X1：每个 (view,sub) 渲染非空，孤儿页 = 0 ---------- */
  const walk = await page.evaluate((routes) => {
    const app = window.__PID_APP__
    const covered = [], orphans = []
    for (const r of routes) {
      const [view, sub] = r.split('/')
      app.state.page = view
      if (sub) app.state.sub[view] = sub
      app.render()
      const n = document.querySelector('#main').innerText.trim().length
      if (n > 20) covered.push(r); else orphans.push(r)
    }
    app.state.page = 'dash'; app.render()
    return { covered: covered.length, total: routes.length, orphans }
  }, LEAF_ROUTES)
  t('IP2', '18 条叶子路由全部渲染非空（孤儿页=0，先证有内容）', walk.covered === walk.total && walk.orphans.length === 0, { covered: walk.covered, total: walk.total, orphans: walk.orphans })

  /* ---------- X2：深链接直达 ---------- */
  await page.evaluate(() => { location.hash = '#records/metrics' })
  await new Promise(r => setTimeout(r, 300))
  const deep = await page.evaluate(() => ({
    crumb: document.querySelector('#breadcrumb').textContent,
    cards: document.querySelectorAll('.mcard').length
  }))
  t('X2', '深链接 #records/metrics 直达且内容真实（指标卡>0）', deep.crumb === '病情档案' && deep.cards > 0, deep)

  /* ---------- Q9/Q10/MT13：A/B 切换整页联动、抽查不串档 ---------- */
  const before = await page.evaluate(() => {
    const app = window.__PID_APP__
    app.state.page = 'dash'; app.render()
    return { name: document.querySelector('#profile-name').textContent, inf: app.profile().infections.length }
  })
  await page.evaluate(() => {
    const app = window.__PID_APP__
    app.state.profileId = 'demo-b'
    app.state.page = 'dash'; app.render()
  })
  const b = await page.evaluate(() => {
    const app = window.__PID_APP__
    return { name: document.querySelector('#profile-name').textContent, inf: app.profile().infections.length, shown: document.querySelector('#main').innerText.includes('值班') }
  })
  await page.evaluate(() => { window.__PID_APP__.state.profileId = 'demo-a'; window.__PID_APP__.render() })
  const back = await page.evaluate(() => ({ name: document.querySelector('#profile-name').textContent, id: window.__PID_APP__.state.profileId }))
  t('Q10', 'A→B→A 抽查不串档（感染条数与医生行动计划随档案切换）', before.name !== b.name && b.inf > before.inf && b.shown && back.id === 'demo-a', { A: before, B: { name: b.name, inf: b.inf }, back: back.name })

  /* ---------- MT/C：指标卡 3D（records/metrics，B 档案） ---------- */
  await page.evaluate(() => {
    const app = window.__PID_APP__
    app.state.profileId = 'demo-b'; app.state.page = 'records'; app.state.sub.records = 'metrics'; app.render()
  })
  const mcard = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.mcard')]
    const heights = cards.map(c => c.getBoundingClientRect().height)
    const before = document.querySelectorAll('.mcard *').length
    const target = cards[0]
    target.focus(); target.click()
    const after = document.querySelectorAll('.mcard *').length
    return {
      count: cards.length,
      minH: Math.min(...heights), maxH: Math.max(...heights),
      pressed: target.getAttribute('aria-pressed'),
      otherPressed: cards[1] ? cards[1].getAttribute('aria-pressed') : null,
      domBefore: before, domAfter: after,
      focusKept: document.activeElement === target,
      inner3d: getComputedStyle(target.querySelector('.mcard-inner')).transformStyle,
      hasBack: !!target.querySelector('.mface.back')
    }
  })
  t('MT04a', 'B 档案指标卡网格非空（免疫球蛋白+亚群多指标，且背面存在）', mcard.count >= 2 && mcard.hasBack, { count: mcard.count })
  t('MT07', '卡片定高 194±1 且同网格高度差 ≤1px', Math.abs(mcard.minH - 194) <= 1 && (mcard.maxH - mcard.minH) <= 1, { minH: mcard.minH, maxH: mcard.maxH })
  t('C11', '翻转中 DOM 节点数不变、焦点保持在同一按钮', mcard.domBefore === mcard.domAfter && mcard.focusKept, { before: mcard.domBefore, after: mcard.domAfter })
  t('C12', '单卡 aria-pressed=true 其他卡仍 false', mcard.pressed === 'true' && mcard.otherPressed === 'false', { pressed: mcard.pressed, other: mcard.otherPressed })
  t('MT08a', 'preserve-3d 内层', mcard.inner3d === 'preserve-3d', { style: mcard.inner3d })

  /* ---------- C 组：一图秀（labs/chart） ---------- */
  await page.evaluate(() => {
    const app = window.__PID_APP__
    app.state.profileId = 'demo-b'; app.state.page = 'labs'; app.state.sub.labs = 'chart'
    app.state.range = 'all'; app.state.picked = { IGG: true, IGA: true }; app.state.showEpisodes = true; app.render()
  })
  const chart1 = await page.evaluate(() => {
    const svg = document.querySelector('#chart-panel svg.chart')
    if (!svg) return { pathCount: 0 }
    const paths = [...svg.querySelectorAll('path[fill="none"]')].map(p => p.getAttribute('d'))
    const fills = [...svg.querySelectorAll('path[fill="none"]')].map(p => getComputedStyle(p).fill)
    const labels = [...svg.querySelectorAll('text')].filter(x => /\d+(\.\d+)?\s?(g\/L|cells)/.test(x.textContent)).length
    return { pathCount: paths.length, nonEmpty: paths.every(d => d && d.length > 10), fillNone: fills.every(f => f === 'none' || f === 'rgba(0, 0, 0, 0)'), endpointLabels: labels }
  })
  t('C1a', '两条序列都渲染为 path 且 fill=none（先证非空）', chart1.pathCount === 2 && chart1.nonEmpty && chart1.fillNone, { pathCount: chart1.pathCount, fillNone: chart1.fillNone })
  t('C5', '只标末点：每序列 1 个数值标签', chart1.endpointLabels === 2, { labels: chart1.endpointLabels })
  const pathsBefore = await page.evaluate(() => [...document.querySelectorAll('#chart-panel svg.chart path[fill="none"]')].map(p => p.getAttribute('d')))
  await page.evaluate(() => { const app = window.__PID_APP__; app.state.showEpisodes = false; app.render() })
  const pathsAfter = await page.evaluate(() => [...document.querySelectorAll('#chart-panel svg.chart path[fill="none"]')].map(p => p.getAttribute('d')))
  await page.evaluate(() => { const app = window.__PID_APP__; app.state.showEpisodes = true; app.render() })
  t('C4', '关闭感染带不改曲线（path[d] 逐项相等且非空）', JSON.stringify(pathsBefore) === JSON.stringify(pathsAfter) && pathsAfter.length > 0, { equal: JSON.stringify(pathsBefore) === JSON.stringify(pathsAfter) })
  /* C2：单点序列（A 档案 IGG 只有 1 条） */
  await page.evaluate(() => {
    const app = window.__PID_APP__
    app.state.profileId = 'demo-a'; app.state.picked = { IGG: true, IGA: false }; app.state.range = 'all'; app.render()
  })
  const single = await page.evaluate(() => {
    const svg = document.querySelector('#chart-panel svg.chart')
    if (!svg) return { paths: -1, circles: -1 }
    return { paths: svg.querySelectorAll('path[fill="none"]').length, circles: svg.querySelectorAll('circle').length }
  })
  t('C2', '单点序列：path=0、circle=1', single.paths === 0 && single.circles === 1, single)
  /* C3：空窗口空态（A 档案 CD4 在近 1 月为空） */
  await page.evaluate(() => {
    const app = window.__PID_APP__
    app.state.picked = { IGG: false, CD4: true }; app.state.range = '1m'; app.render()
  })
  const empty = await page.evaluate(() => ({
    text: document.querySelector('#chart-panel').innerText,
    pre: window.__PID_APP__.seriesCount('CD4')
  }))
  t('C3', '空窗口有空态文案（前置：该序列在窗口内 0 条）', empty.pre === 0 && empty.text.includes('没有所选指标'), { pre: empty.pre, text: empty.text.slice(0, 30) })
  /* C8：时间窗联动（B 档案 IGG：全部 5 条 → 近 3 月 3 条） */
  await page.evaluate(() => {
    const app = window.__PID_APP__
    app.state.profileId = 'demo-b'; app.state.picked = { IGG: true, IGA: false }; app.state.range = 'all'; app.render()
  })
  const allN = await page.evaluate(() => window.__PID_APP__.seriesCount('IGG'))
  await page.evaluate(() => { const app = window.__PID_APP__; app.state.range = '3m'; app.render() })
  const w3m = await page.evaluate(() => window.__PID_APP__.seriesCount('IGG'))
  await page.evaluate(() => { const app = window.__PID_APP__; app.state.range = 'all'; app.render() })
  t('C8', '切近 3 月后点数减少（all=' + allN + '）', allN > w3m && w3m >= 1, { all: allN, win3m: w3m })

  /* ---------- 私密三出口（Q35，代码级：看板摘要 / 导出预览 / AI 上下文） ---------- */
  await page.evaluate(() => {
    const app = window.__PID_APP__
    app.state.profileId = 'demo-b'; app.state.page = 'dash'; app.render()
  })
  const priv = await page.evaluate(() => {
    const app = window.__PID_APP__
    const dashText = document.querySelector('#main').innerText
    const prompt = app.aiPromptFor('labs')
    const line = app.privacyLine(app.profile().reports)
    return {
      dashExcludesPrivate: !dashText.includes('不想展示'),
      dashShowsCount: dashText.includes('私密'),
      promptExcludesPrivate: !prompt.includes('2026-10-30') && prompt.includes('已排除私密'),
      line
    }
  })
  t('Q35a', '看板摘要与 AI 上下文排除私密记录（同一 sharedOnly 过滤）', priv.dashExcludesPrivate && priv.dashShowsCount && priv.promptExcludesPrivate, priv)
  const privAgg = await page.evaluate(() => {
    const app = window.__PID_APP__
    const st = app.derivedStatus()
    const all = app.profile().infections
    const dashText = document.querySelector('#main').innerText
    return {
      yearCount: st.yearCount,
      sharedYear: all.filter(f => !f.private && new Date(f.start) >= new Date(TODAYminus365())).length,
      hasPrivateNote: dashText.includes('未计入')
    }
    function TODAYminus365() { const d = new Date(app.DATA.TODAY); d.setDate(d.getDate() - 365); return d.toISOString().slice(0, 10) }
  })
  t('Q35c', '私密感染不进状态卡聚合（近 12 月只算共享，且页内标注未计入）', privAgg.yearCount === privAgg.sharedYear && privAgg.hasPrivateNote, privAgg)
  await page.evaluate(() => { const app = window.__PID_APP__; app.state.page = 'records'; app.state.sub.records = 'summary'; app.render() })
  const histBefore = await page.evaluate(() => history.length)
  await page.evaluate(() => document.querySelector('[data-action="pv-export"]').click())
  await page.waitForSelector('.pv-overlay:not([hidden])', { timeout: 3000 })
  const pv = await page.evaluate(() => {
    const o = document.querySelector('.pv-overlay')
    const r = o.getBoundingClientRect()
    return {
      visible: !o.hidden && r.height > window.innerHeight * 0.8,
      hasBack: !!o.querySelector('[data-pv="back"]'),
      hasClose: !!o.querySelector('[data-pv="close"]'),
      title: o.querySelector('.pv-title').textContent,
      bodyText: o.querySelector('.pv-body').innerText,
      hist: history.length,
      hash: location.hash
    }
  })
  t('A1/A10', '整页视图打开（高度≥80%视口、返回+关闭双入口、history+1）', pv.visible && pv.hasBack && pv.hasClose && pv.hist > histBefore, { title: pv.title, hist: pv.hist, hash: pv.hash })
  t('A9', '整页标题无「未命名」且与内容一致', pv.title.includes('导出预览') && !pv.title.includes('未命名'), { title: pv.title })
  t('Q35b', '导出预览排除私密原文并给出条数说明', !pv.bodyText.includes('不想让导出带出去') && !pv.bodyText.includes('不想展示') && pv.bodyText.includes('未包含'), {})
  /* A5：滚动后打开、关闭后恢复 */
  await page.keyboard.press('Escape')
  await new Promise(r => setTimeout(r, 400))
  await page.setViewport({ width: 1280, height: 500 })
  await page.evaluate(() => {
    /* Escape 后 hash 回跳可能把路由带走：显式回到导出预览所在页再量滚动恢复 */
    const app = window.__PID_APP__
    app.state.page = 'records'; app.state.sub.records = 'summary'; app.render()
    window.scrollTo(0, 160)
  })
  await new Promise(r => setTimeout(r, 200))
  await page.evaluate(() => document.querySelector('[data-action="pv-export"]').click())
  await page.waitForSelector('.pv-overlay:not([hidden])', { timeout: 3000 })
  await page.keyboard.press('Escape')
  await new Promise(r => setTimeout(r, 500))
  const a5 = await page.evaluate(() => ({ scroll: window.scrollY, closed: document.querySelector('.pv-overlay').hidden }))
  t('A2/A5', 'Esc 关一层且滚动位置恢复', a5.closed && Math.abs(a5.scroll - 160) <= 4, a5)
  await page.setViewport({ width: 1280, height: 860 })

  /* ---------- agent-draft：只填草稿不发送（Q14/Q17/Q19） ---------- */
  await page.evaluate(() => { window.__msg__ = []; window.addEventListener('message', e => window.__msg__.push({ type: e.data && e.data.type, send: e.data && e.data.send })) })
  await page.evaluate(() => { const app = window.__PID_APP__; app.state.profileId = 'demo-b'; app.state.page = 'labs'; app.state.sub.labs = 'chart'; app.render() })
  await page.click('[data-action="ai"]')
  const draft = await page.evaluate(() => ({
    paneVisible: !document.querySelector('#agent-pane').hidden,
    text: document.querySelector('#agent-input').value,
    sendDisabled: document.querySelector('.agent-foot button.primary').disabled,
    msgs: window.__msg__
  }))
  t('Q14', '页面「和 AI 讨论」打开演示面板并填入草稿', draft.paneVisible && draft.text.includes('和 AI 讨论本页'), { ok: draft.paneVisible })
  t('Q17', '草稿只填不发（发送键 disabled、无 postMessage）', draft.sendDisabled && draft.msgs.length === 0, draft.msgs)
  t('Q19', '携带上下文不含判定词', !/诊断|分级|预后|建议|风险/.test(draft.text), { text: draft.text.slice(0, 60) })

  /* ---------- 设置弹层 / 裁剪态临床 tab / 看板指标卡 ---------- */
  await page.evaluate(() => { window.__PID_APP__.state.page = 'dash'; window.__PID_APP__.render() })
  await page.click('[data-action="settings"]')
  const cfg = await page.evaluate(() => ({
    open: document.querySelector('#dialog').open,
    tabs: [...document.querySelectorAll('[data-action="settings-tab"]')].map(b => b.textContent.trim())
  }))
  t('CFG1', '设置弹层打开且三 tab（工作区/MinerU/临床数据库）', cfg.open && cfg.tabs.join('|') === '工作区|文档解析（MinerU）|临床数据库', cfg)
  await page.evaluate(() => document.querySelector('[data-action="settings-tab"][data-tab="clinic"]').click())
  const clip = await page.evaluate(() => {
    const txt = document.querySelector('#dialog-body').innerText
    return {
      stated: txt.includes('裁剪'),
      measured: txt.includes('601'),
      honest: txt.includes('未接入'),
      noFakeSearch: !document.querySelector('#trial-kw')
    }
  })
  t('CLIN0', '临床数据库 tab：裁剪明示 + 实测数字 + 如实未接入 + 无假检索', clip.stated && clip.measured && clip.honest && clip.noFakeSearch, clip)
  await page.evaluate(() => document.querySelector('[data-action="dialog-close"]').click())
  const tiles = await page.evaluate(() => document.querySelectorAll('.stat-tile').length)
  t('TILE1', '看板关键指标最近值卡 ≥5 张（免疫球蛋白+亚群+血象）', tiles >= 5, { tiles })
  await page.evaluate(() => { const a = window.__PID_APP__; a.state.page = 'records'; a.state.sub.records = 'metrics'; a.render() })
  const mcards = await page.evaluate(() => ({ n: document.querySelectorAll('.mcard').length, groups: document.querySelectorAll('.metric-group').length }))
  t('MC1', '指标检测页指标卡 ≥6 张、分组 ≥3（6 指标 3 组，按有数据渲染）', mcards.n >= 6 && mcards.groups >= 3, mcards)

  /* ---------- 添加记录按钮 + 录入表单 + 翻转双通道 ---------- */
  const addBtns = await page.evaluate(() => {
    const a = window.__PID_APP__
    const out = {}
    for (const pg of ['infections', 'labs', 'infusions', 'vaccine', 'visits', 'reports']) {
      a.state.page = pg
      a.state.sub[pg] = ({ infections: 'list', labs: 'list', infusions: 'log', vaccine: 'log', visits: 'prep', reports: 'list' })[pg]
      a.render()
      out[pg] = document.querySelector('#main').innerText.includes('＋')
    }
    return out
  })
  t('ADD1', '六个可写页都有「＋添加记录」入口', Object.values(addBtns).every(Boolean), addBtns)
  const forms = await page.evaluate(() => {
    const a = window.__PID_APP__
    const out = {}
    a.state.page = 'labs'; a.state.sub.labs = 'list'; a.render(); out.labs = !!document.querySelector('#form-lab')
    a.state.page = 'reports'; a.state.sub.reports = 'list'; a.render(); out.reports = !!document.querySelector('#form-report')
    a.state.page = 'vaccine'; a.state.sub.vaccine = 'log'; a.render(); out.vax = !!document.querySelector('#form-vax')
    return out
  })
  t('ADD2', '化验/报告/医生口径录入表单齐备（三态保存）', forms.labs && forms.reports && forms.vax, forms)
  const flip2 = await page.evaluate(async () => {
    const a = window.__PID_APP__
    a.state.flipped = {} /* 前序 C12 已把卡 0 翻过：先归零再测双通道 */
    a.state.page = 'records'; a.state.sub.records = 'metrics'; a.render()
    const c = document.querySelectorAll('.mcard')[0]
    c.click()
    await new Promise(r => setTimeout(r, 700))
    return { pressed: c.getAttribute('aria-pressed'), cls: c.className.includes('flipped'), tf: getComputedStyle(c.querySelector('.mcard-inner')).transform }
  })
  t('FLIP2', '翻转双通道（aria-pressed + flipped class，终态 matrix3d 含 rotateY）', flip2.pressed === 'true' && flip2.cls && /matrix3d/.test(flip2.tf) && flip2.tf.includes('-1'), flip2)

  /* ---------- Q26：390 宽无横向溢出（CDP） ---------- */
  const client = await page.target().createCDPSession()
  await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await new Promise(r => setTimeout(r, 300))
  const narrow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  await client.send('Emulation.clearDeviceMetricsOverride')
  await page.setViewport({ width: 1280, height: 860 })
  await new Promise(r => setTimeout(r, 400))
  t('Q26', '390 宽无横向溢出（scrollWidth===clientWidth===390）', narrow.sw === 390 && narrow.cw === 390, narrow)

  /* ---------- Q4/Q5：顶栏顺序与 AI 面板宽度 ---------- */
  const topbar = await page.evaluate(() => {
    const ta = document.querySelector('.top-actions')
    const pane = document.querySelector('#agent-pane')
    const wa = document.querySelector('.app-body').getBoundingClientRect()
    const opened = !pane.hidden
    const w = pane.getBoundingClientRect().width / wa.width * 100
    return { order: [...ta.children].map(b => b.textContent.trim()).join('|'), widthPct: Math.round(w), opened }
  })
  t('Q4', '顶栏操作组顺序（资料目录→AI→设置→大字→?→版本）', /资料目录.*AI 对话.*设置.*大字 Aa.*\?.*v0/.test(topbar.order), topbar.order)
  t('Q5', 'AI 面板打开时宽度在 25–45%', topbar.opened && topbar.widthPct >= 25 && topbar.widthPct <= 45, { pct: topbar.widthPct })

  /* ---------- P1b：首页病情介绍第二入口（顶栏 ? 之外的文字按钮） ---------- */
  await page.evaluate(() => { const a = window.__PID_APP__; a.state.page = 'dash'; a.render() })
  const primerEntries = await page.evaluate(() => [...document.querySelectorAll('[data-primer-open]')].map((b, i) => ({
    i, text: (b.textContent || '').trim(), visible: b.getBoundingClientRect().width > 0,
  })))
  const secondEntry = primerEntries.find((e) => e.visible && e.text && e.text !== '?')
  let secondOpened = false
  if (secondEntry) {
    await page.evaluate((i) => {
      const b = document.querySelectorAll('[data-primer-open]')[i]
      b.focus(); b.click()
    }, secondEntry.i)
    await new Promise((r) => setTimeout(r, 360))
    secondOpened = await page.evaluate(() => {
      const el = document.getElementById('disease-primer') || document.querySelector('.dp-overlay')
      return !!el && !el.hidden && el.querySelectorAll('.dp-section').length === 4
    })
    await page.keyboard.press('Escape')
    await new Promise((r) => setTimeout(r, 320))
  }
  const secondFocusBack = await page.evaluate(() => {
    const a = document.activeElement
    return !!(a && a.closest && a.closest('[data-primer-open]'))
  })
  t('P1b', '首页病情介绍第二入口可点开四段，Esc 后焦点回到该入口',
    primerEntries.filter((e) => e.visible).length >= 2 && !!secondEntry && secondOpened && secondFocusBack,
    { entries: primerEntries, secondOpened, secondFocusBack })

  /* ---------- 页面错误 ---------- */
  t('ERR', '无页面错误（pageerror/console.error）', errors.length === 0, errors.slice(0, 3))

  await browser.close()
  const fails = results.filter(r => !r.pass)
  console.log(`\nSUMMARY: ${results.length - fails.length}/${results.length} pass, ${fails.length} fail` + (fails.length ? ' → ' + fails.map(f => f.id).join(', ') : ''))
  process.exit(fails.length ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
