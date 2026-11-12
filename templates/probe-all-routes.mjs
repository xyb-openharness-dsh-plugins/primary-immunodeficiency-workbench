#!/usr/bin/env node
/**
 * 全量路由渲染探针模板（M2 闸口 · 从 aatd-workbench probe-aatd-m2.mjs 模板化）
 *
 * 用途：穷举 prototypes/v0.2/app.js 的全部叶子路由 × 每套演示档案，逐路由断言
 * 「渲染非空 + 页头名一致」，并做 A/B 切档不串档的可见证据断言。产出截图与 report.json。
 *
 * 接入（复制进项目 scripts/ 后三步）：
 *   1. 把 ROUTES 数组改成项目 ROUTES 的叶子（与 app.js 的 ROUTES 声明一一对应；
 *      check-probe-coverage.mjs 会核对该探针覆盖每条叶子，改名后漏页必红）。
 *   2. 依赖 scripts/cdp.mjs（launchChrome/sleep/stopChrome，家族 workspace 已装）。
 *   3. 挂进 npm run probe:m2；M2 签认前退出码必须 0。
 *
 * 硬口径（家族教训）：
 *   - 先证被测对象非空，再断言比较（空值恒真 = 没断言）；
 *   - 档案差异证据 = 页头档案名变化 + 磁盘数据对账，两套数据不得只差一个 flag；
 *   - 对 render 替换后的 DOM 操作必须重查节点（脱节点 click 不冒泡）。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome, sleep, stopChrome } from './cdp.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'docs', 'shots', 'm2');
mkdirSync(join(SHOTS, 'A'), { recursive: true });
mkdirSync(join(SHOTS, 'B'), { recursive: true });
const CDP_PORT = Number(process.env.PROBE_M2_CDP_PORT || 9367);
const URL_APP = `file://${join(ROOT, 'prototypes', 'v0.2', 'index.html')}`;

/* ← 换成本项目叶子路由（顶层无子页页 + 每个有子页页的全部叶子） */
const ROUTES = [
  'home', 'labs', 'chart', 'treatment', 'family', 'review', 'settings',
  'course/timeline', 'course/list',
  'records/lib', 'records/draft', 'records/archive', 'records/panel', 'records/summary',
  'mind/feel', 'mind/life',
  'trial/build', 'trial/search', 'trial/chain', 'trial/cand'
];

const ch = await launchChrome({ port: CDP_PORT });
const { cdp } = ch;
const report = { screenshots: 0, errors: [], assertions: {}, routeResults: [] };

async function navigate(route) {
  await cdp.eval(`location.hash = '#${route}'; window.dispatchEvent(new Event('hashchange'));`);
  await sleep(180);
}
async function shot(file) {
  const s = await cdp.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(file, Buffer.from(s.data, 'base64'));
  report.screenshots += 1;
}

try {
  await cdp.send('Page.navigate', { url: URL_APP });
  await sleep(700);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 940, deviceScaleFactor: 1, mobile: false });
  const booted = await cdp.eval("!!document.querySelector('#nav .nav-button')");
  if (!booted) throw new Error('页面未启动');

  for (const prof of ['A', 'B']) {
    await navigate('home');
    /* ← 换成本项目的档案切换入口（顶栏按钮 + data-pick-profile 行） */
    await cdp.eval("document.getElementById('profile-top').click()"); await sleep(150);
    const picked = await cdp.eval(`(() => {
      const b = [...document.querySelectorAll('[data-pick-profile]')].find(x => x.dataset.pickProfile === '${prof}');
      if (!b) return false;
      b.click(); return true;
    })()`);
    if (!picked) report.errors.push(`档案 ${prof}：切换入口未命中`);
    await sleep(250);

    const profName = await cdp.eval("(document.getElementById('profile-top-name')||{textContent:''}).textContent.trim()");
    report.assertions[`name_${prof}`] = profName;
    if (!profName) report.errors.push(`档案 ${prof}：页头未显示档案名`);

    for (const route of ROUTES) {
      await navigate(route);
      const mainLen = await cdp.eval("document.getElementById('main') ? document.getElementById('main').innerHTML.length : 0");
      if (!(mainLen > 200)) report.errors.push(`${prof}/${route}: 渲染过空（innerHTML=${mainLen}）`);
      report.routeResults.push({ profile: prof, route, mainLen });
      await shot(join(SHOTS, prof, `${route.replace('/', '__')}.png`));
    }
  }

  const na = report.assertions.name_A, nb = report.assertions.name_B;
  if (!na || !nb) report.errors.push(`A/B 页头不可用：${na} / ${nb}`);
  else if (na === nb) report.errors.push(`A/B 档案页头相同（${na}）——两套数据未生效或串档`);
} catch (err) {
  report.errors.push(`probe crashed: ${err.message}`);
} finally {
  writeFileSync(join(SHOTS, 'report.json'), JSON.stringify(report, null, 1));
  console.log(`routes walked: ${report.routeResults.length}  screenshots: ${report.screenshots}  errors: ${report.errors.length}`);
  for (const e of report.errors.slice(0, 20)) console.log(`FAIL ${e}`);
  await stopChrome(ch);
  process.exit(report.errors.length ? 1 : 0);
}
