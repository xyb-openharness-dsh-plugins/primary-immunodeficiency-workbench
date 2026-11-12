/* README 实渲截图生成（33 号：至少 4 张 + 折叠收/展态，文件名含版本）
 * 用法：node scripts/shoot-v0.2.0.mjs [--url URL]
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
const PORT = Number(argOf('--port') || 8143)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon' }

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync) || null
}

const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (p === '/favicon.ico') { res.writeHead(204); res.end(); return }
    const file = normalize(join(ROOT, p))
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return }
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' })
    res.end(await readFile(file))
  } catch { res.writeHead(404); res.end() }
})

async function main() {
  await new Promise(r => server.listen(PORT, '127.0.0.1', r))
  let puppeteer
  try { puppeteer = createRequire('/Users/qinxiaoqiang/.workbuddy/binaries/node/workspace/')('puppeteer-core') }
  catch { puppeteer = require('puppeteer-core') }
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 860 })
  const url = argOf('--url') || `http://127.0.0.1:${PORT}/prototypes/v0.2/index.html`
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__PID_APP__ && document.querySelectorAll('#nav button').length >= 9, { timeout: 5000 })
  const shot = (name) => page.screenshot({ path: join(ROOT, 'docs/assets/' + name) })

  /* 1. 看板（B 档案，信息最全） */
  await page.evaluate(() => { const a = window.__PID_APP__; a.state.profileId = 'demo-b'; a.state.page = 'dash'; a.render() })
  await shot('v0.2.0-dashboard.png')

  /* 2. 感染与急症（列表 + 录入表单） */
  await page.evaluate(() => { const a = window.__PID_APP__; a.state.page = 'infections'; a.state.sub.infections = 'list'; a.render() })
  await shot('v0.2.0-infections.png')

  /* 3. 一图秀（B 档案 IGG+IGA） */
  await page.evaluate(() => { const a = window.__PID_APP__; a.state.page = 'labs'; a.state.sub.labs = 'chart'; a.state.picked = { IGG: true, IGA: true, IGM: false, CD4: false, CD19: false, WBC: false }; a.state.range = 'all'; a.render() })
  await shot('v0.2.0-one-chart.png')

  /* 4. 指标卡（指标检测页 + 翻转一张） */
  await page.evaluate(() => { const a = window.__PID_APP__; a.state.page = 'records'; a.state.sub.records = 'metrics'; a.render() })
  await page.evaluate(() => document.querySelectorAll('.mcard')[0].click())
  await new Promise(r => setTimeout(r, 700))
  await shot('v0.2.0-metric-cards.png')
  await page.evaluate(() => document.querySelectorAll('.mcard')[0].click())

  /* 5/6. 疾病概要四段（整页 DP） */
  await page.evaluate(() => { const a = window.__PID_APP__; a.state.page = 'dash'; a.render() })
  await page.evaluate(() => document.querySelector('[data-primer-open]').click())
  await new Promise(r => setTimeout(r, 400))
  await shot('v0.2.0-disease-primer.png')
  await page.evaluate(() => document.querySelector('.dp-body').scrollTo(0, 99999))
  await new Promise(r => setTimeout(r, 200))
  await shot('v0.2.0-disease-primer-tail.png')
  await page.keyboard.press('Escape')

  /* 7/8. 折叠收/展态（一图秀 rail 的指标分组 details） */
  await page.evaluate(() => { const a = window.__PID_APP__; a.state.page = 'labs'; a.state.sub.labs = 'chart'; a.render() })
  await page.evaluate(() => document.querySelectorAll('details.pick').forEach(d => { d.open = false }))
  await new Promise(r => setTimeout(r, 200))
  await shot('v0.2.0-fold-closed.png')
  await page.evaluate(() => document.querySelectorAll('details.pick').forEach(d => { d.open = true }))
  await new Promise(r => setTimeout(r, 200))
  await shot('v0.2.0-fold-open.png')

  await browser.close()
  server.close()
  console.log('shots done → docs/assets/')
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
