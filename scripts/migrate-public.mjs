#!/usr/bin/node
/**
 * public/ 定点移植（小愈宝 HealPal 版）：**复制原型 → 定点替换**，不手抄。
 *
 * 替换点（只有这些，其它与原型逐字符相同——ui-parity 口径）：
 *   1. index.html：加 noindex；「交互原型」条改开发版措辞；ver-chip 与页脚版本/构建日期
 *      走 __VERSION_DISPLAY__ / __BUILD_DATE__ 占位（server.js 注入，两种形态同一份文件）；
 *   2. app.js：APP_INFO 版本/构建走占位符；boot 后追加「bootstrap 混合数据源」块——
 *      宿主形态拉 /api/bootstrap（读模型还原 demo 形状，parity 由测试断言），
 *      file:// 与拉取失败一律回退演示数据（禁裸 throw，禁白屏）。
 *   3. style.css / demo-data.js / primer-data.js / primer.js / primer.css：逐字节复制。
 *
 * 用法：node scripts/migrate-public.mjs [--check]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, 'prototypes/v0.2');
const OUT = join(ROOT, 'public');
const CHECK = process.argv.includes('--check');
const FILES = ['index.html', 'app.js', 'style.css', 'demo-data.js', 'primer-data.js', 'primer.js', 'primer.css', 'trial-match.js'];

const TITLE_OLD = '<title>小愈宝 HealPal · 天疱疮工作台（交互原型 v0.2）</title>';
const TITLE_NEW = '<title>小愈宝 HealPal · 天疱疮工作台</title>\n<meta name="robots" content="noindex,nofollow">';
const BAR_OLD = '    <span>交互原型 v0.2 · 全部为模拟资料 · 合成示例</span>\n    <span>仅本页演示 · 未接入 DSH/AI</span>';
const BAR_NEW = '    <span>开发版 · 本机数据 · 不上传 · AI 面板由宿主提供 · 业务数据仍为演示内容直到导入真实资料</span>\n    <span>版本 <b>__VERSION_DISPLAY__</b></span>';
const CHIP_OLD = '<span class="ver-chip" id="ver-chip">v0.2.0</span>';
const CHIP_NEW = '<span class="ver-chip" id="ver-chip">__VERSION_DISPLAY__</span>';
const FOOT_OLD = '<b id="app-version">v0.2.0</b><em id="app-build">2026-11-10</em>';
const FOOT_NEW = '<b id="app-version">__VERSION_DISPLAY__</b><em id="app-build">__BUILD_DATE__</em>';
const APPINFO_OLD = "var APP_INFO = { version: 'v0.2.0', build: '2026-11-10' }";
const APPINFO_NEW = "var APP_INFO = { version: '__VERSION_DISPLAY__', build: '__BUILD_DATE__' }";

const BOOT_BLOCK = `

/* ── 开发版数据源（scripts/migrate-public.mjs 注入点；原型无此块）──
   宿主形态优先 bootstrap（读模型还原 demo 形状，parity 由测试断言）；
   file:// 与拉取失败回退演示数据：不裸 throw、不白屏。 */
;(function () {
  var apiBase = "__API_BASE__"; /* 令牌会被宿主注入成字符串字面量；禁止把令牌挂在 window 对象上（注入后会语法错误） */
  if (location.protocol === 'file:') return; /* 独立双击打开：走演示态，未接通后端，页面已明说 */
  /* 部署态：AI 对话由宿主原生面板承载（agent-draft 契约）——页面内「AI 对话（演示）」坞整体退场 */
  if (window.parent !== window) {
    for (var dieId of ['agent-pane', 'agent-splitter', 'agent-toggle']) {
      var dead = document.getElementById(dieId)
      if (dead && dead.parentNode) dead.parentNode.removeChild(dead)
    }
  }
  fetch(apiBase + '/api/bootstrap').then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return r.json()
  }).then(function (b) {
    if (!b || !Array.isArray(b.profiles) || !b.profiles.length || b.TODAY == null) throw new Error('bootstrap 形状不符')
    window.DEMO_DATA.TODAY = b.TODAY
    window.DEMO_DATA.profiles = b.profiles
    var app = window.__PERI_APP__
    if (app && app.render) {
      app.state.profileId = b.profiles[0].id
      app.state.page = 'dash'
      app.state.sub = {}
      app.state.range = 'all'
      app.state.picked = { CRP: true, ESR: true, WBC: false, cTnI: false, 'NT-proBNP': false, ALT: false, Cr: false, '体温': false }
      app.state.showEpisodes = true
      app.state.flipped = {}
      app.render()
    }
    window.__PERI_API_BASE__ = apiBase
    console.info('[workbench] 已切换到本机数据库数据（' + b.profiles.length + ' 个档案）')
  }).catch(function (e) {
    console.warn('[workbench] bootstrap 不可用，继续使用演示数据：', String(e && e.message || e))
  });
})();`

function migrateIndex(s) {
  return s
    .replace(TITLE_OLD, TITLE_NEW)
    .replace(BAR_OLD, BAR_NEW)
    .replace(CHIP_OLD, CHIP_NEW)
    .replace(FOOT_OLD, FOOT_NEW);
}

function migrateApp(s) {
  return s.replace(APPINFO_OLD, APPINFO_NEW) + BOOT_BLOCK;
}

function expected(name) {
  const src = readFileSync(join(SRC, name), 'utf8');
  if (name === 'index.html') return migrateIndex(src);
  if (name === 'app.js') return migrateApp(src);
  return src;
}

export { FILES, migrateIndex, migrateApp, expected, SRC, OUT };

function check() {
  const problems = [];
  for (const f of FILES) {
    let current = '';
    try { current = readFileSync(join(OUT, f), 'utf8'); } catch { problems.push(`public/${f} 缺失（跑 npm run build:public）`); continue; }
    const want = expected(f);
    if (current !== want) problems.push(`public/${f} 与原型定点移植产物不一致（跑 npm run build:public 后人工复核 diff）`);
  }
  if (problems.length) { console.error('✗ public/ 与 prototypes/v0.2 定点移植不一致：\n  ' + problems.join('\n  ')); process.exit(1); }
  console.log(`✓ public/ 七件与 prototypes/v0.2 定点移植一致（index.html/app.js 仅白名单替换点，其余五件逐字节相同）`);
}

function build() {
  mkdirSync(OUT, { recursive: true });
  for (const f of FILES) writeFileSync(join(OUT, f), expected(f));
  console.log(`✓ public/ 已从 prototypes/v0.2 定点移植（${FILES.length} 件）`);
}

/* 仅直接执行时跑主流程（被测试/检查器 import 时只取上面的纯函数） */
const INVOKED_DIRECTLY = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
/* Windows/软链兜底：路径比较失败时退回 argv 特征判断 */
const _invoked = INVOKED_DIRECTLY || (process.argv[1] && process.argv[1].endsWith('migrate-public.mjs'));
if (_invoked) {
  if (CHECK) check();
  else build();
}
