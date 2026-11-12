#!/usr/bin/env node
/**
 * ui-parity 闸门：public/ 与 prototypes/v0.2 的移植一致性（M5 检查链追加项）。
 *
 * 与 test/ui-parity.test.mjs 同一判据，给 npm run check 用：
 *   - style.css / demo-data.js / primer-data.js / primer.js / primer.css：逐字节相同；
 *   - index.html / app.js：等于「原型 + 白名单替换点」产物（业务文件不改字符）。
 *
 * 用法：node scripts/check-ui-parity.mjs
 * 退出码：0 一致 / 1 不一致
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILES, expected, OUT } from './migrate-public.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
/* trial-match.js 只在保留试验线的仓存在（裁剪仓如实没有）；存在才逐字节比对。 */
const BYTE_COPY = ['style.css', 'demo-data.js', 'primer-data.js', 'primer.js', 'primer.css'].concat(
  existsSync(join(ROOT, 'prototypes/v0.2/trial-match.js')) ? ['trial-match.js'] : []);
const problems = [];

for (const f of BYTE_COPY) {
  const proto = readFileSync(join(ROOT, 'prototypes/v0.2', f));
  let pub = null;
  try { pub = readFileSync(join(OUT, f)); } catch { problems.push(`public/${f} 缺失`); continue; }
  if (!proto.equals(pub)) problems.push(`public/${f} 与原型逐字节不一致`);
}
for (const f of FILES) {
  let pub = '';
  try { pub = readFileSync(join(OUT, f), 'utf8'); } catch { problems.push(`public/${f} 缺失`); continue; }
  if (pub !== expected(f)) problems.push(`public/${f} 与定点移植产物不一致（白名单之外被改动）`);
}

if (problems.length) {
  console.error('✗ ui-parity 不一致：\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log('✓ ui-parity：public/ 八件与 prototypes/v0.2 定点移植一致（六件逐字节、两件仅白名单替换点）');
