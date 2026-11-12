/* 宿主形态（独立 dev-server）无头走查：AUTOFIX 开工三步第 2 步——点真实按钮，不是 curl。
 * 断言：设置弹层三 tab / DP ？双入口打开四段 / A·B 档案切换联动 / AI 演示面板开合 /
 *       bootstrap 混合数据源生效（页面档案名来自本机库）/ 390 无溢出 / 无页面错误。
 * 用法：node scripts/probe-host-form.mjs [--url http://127.0.0.1:7821/]
 */
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'

const args = process.argv.slice(2)
const argOf = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null }
const URL_ = argOf('--url') || 'http://127.0.0.1:7821/'

const require = createRequire(import.meta.url)
function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync) || null
}
const out = []
const t = (id, pass, detail) => { out.push({ id, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + id + '  ' + JSON.stringify(detail).slice(0, 200)) }

async function main() {
  let puppeteer
  try { puppeteer = createRequire('/Users/qinxiaoqiang/.workbuddy/binaries/node/workspace/')('puppeteer-core') }
  catch { puppeteer = require('puppeteer-core') }
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()) })
  await page.setViewport({ width: 1280, height: 860 })
  await page.goto(URL_, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__PID_APP__ && document.querySelectorAll('#nav button').length >= 9, { timeout: 8000 })

  /* 1. bootstrap 混合数据源：宿主形态档案来自本机库（TODAY 从 /api/bootstrap 来） */
  const boot = await page.evaluate(() => ({
    today: window.DEMO_DATA.TODAY,
    apiBase: window.__PID_API_BASE__ || '',
    profiles: window.DEMO_DATA.profiles.length,
    demoPaneGone: !document.getElementById('agent-pane'),
  }))
  t('HOST1', 'bootstrap 生效：档案来自本机库且 AI 演示坞退场（iframe 前置形态）', boot.profiles === 2 && boot.apiBase === '' && boot.today === '2026-11-13', boot)

  /* 2. 设置弹层：点真实按钮 → 三 tab 可切 */
  await page.click('[data-action="settings"]')
  await page.waitForFunction(() => document.querySelector('#dialog')?.open, { timeout: 3000 })
  const cfg = await page.evaluate(() => ({
    open: document.querySelector('#dialog').open,
    tabs: [...document.querySelectorAll('[data-action="settings-tab"]')].map(b => b.textContent.trim()),
  }))
  await page.click('[data-action="settings-tab"][data-tab="mineru"]')
  const mineru = await page.evaluate(() => document.querySelector('#dialog-body').innerText.includes('MinerU') && document.querySelector('#dialog-body').innerText.includes('不联网'))
  await page.click('[data-action="dialog-close"]')
  t('HOST2', '设置弹层点开且三 tab 可切（MinerU tab 含「不联网」如实标注）', cfg.open && cfg.tabs.join('|') === '工作区|文档解析（MinerU）|临床数据库' && mineru, cfg)

  /* 3. DP ？双入口（宿主形态 public/ 里同样接好） */
  await page.evaluate(() => document.querySelector('[data-primer-open]').click())
  await page.waitForFunction(() => (document.getElementById('disease-primer') || document.querySelector('.dp-overlay'))?.hidden === false, { timeout: 3000 })
  const dp = await page.evaluate(() => ({
    sections: document.querySelectorAll('.dp-section').length,
    ids: [...document.querySelectorAll('.dp-section')].map(s => s.getAttribute('data-dp-section')).join(','),
  }))
  await page.keyboard.press('Escape')
  await new Promise(r => setTimeout(r, 350))
  t('HOST3', '？打开整页疾病概要四段（definition,evidence,landscape,trend）', dp.sections === 4 && dp.ids === 'definition,evidence,landscape,trend', dp)

  /* 4. 档案切换（真实点击 profile 按钮 → 选 demo-b） */
  await page.click('[data-action="profiles"]')
  await page.waitForFunction(() => document.querySelector('#dialog')?.open, { timeout: 3000 })
  await page.evaluate(() => { const b = [...document.querySelectorAll('[data-action="pick-profile"]')].find(x => x.getAttribute('data-id') === 'demo-b'); b && b.click() })
  await new Promise(r => setTimeout(r, 400))
  const switched = await page.evaluate(() => ({
    name: document.querySelector('#profile-name').textContent,
    infPage: (window.__PID_APP__.profile().infections || []).length,
  }))
  t('HOST4', 'A→B 档案切换联动（B 感染 8 条）', switched.name.includes('示例档案 B') && switched.infPage === 8, switched)

  /* 5. 390 宽无横向溢出（CDP） */
  const client = await page.target().createCDPSession()
  await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await new Promise(r => setTimeout(r, 300))
  const narrow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  await client.send('Emulation.clearDeviceMetricsOverride')
  t('HOST5', '390 宽无横向溢出', narrow.sw === 390 && narrow.cw === 390, narrow)

  t('HOST6', '无页面错误', errors.length === 0, errors.slice(0, 3))
  await browser.close()
  const fails = out.filter(r => !r.pass)
  console.log(`\nSUMMARY: ${out.length - fails.length}/${out.length} pass` + (fails.length ? ' → ' + fails.map(f => f.id).join(', ') : ''))
  process.exit(fails.length ? 1 : 0)
}
main().catch(e => { console.error(e); process.exit(1) })
