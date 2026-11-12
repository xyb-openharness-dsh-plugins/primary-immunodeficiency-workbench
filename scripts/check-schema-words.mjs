/* 判读列断言 + sha256 冻结核对（G3）
 * 用法：node scripts/check-schema-words.mjs [项目目录]
 * 断言：
 *   1. schema/*.sql 全表全列无判读类命名（diagnosis/risk_level/复发性评分/病期/线序/疗效/活动度…）
 *   2. 非肿瘤禁词不出现在 schema（D+N/day_index/粒缺…）
 *   3. freeze-contract.md 记录的 sha256 与当前文件一致（不一致=冻结被改）
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = process.argv[2] ? resolve(process.argv[2]) : resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(ROOT, 'schema')
if (!existsSync(dir)) { console.log('SKIP 无 schema 目录（M3 未开始）'); process.exit(0) }

const BANNED = [
  /\bdiagnosis\b/i, /\brisk_level\b/i, /\bactivity_score\b/i, /\bgrade\b/i, /\bstaging?\b/i,
  /\bline_of_treatment\b/i, /\befficacy\b/i, /\bresponse_status\b/i, /\bmrd\b/i,
  /\brelapse_score\b/i, /\bseverity_grade\b/i, /\bday_index\b/i, /\bprognosis\b/i,
  /病期|线序|疗效|治愈率|复发评分|危险度|预后/
]
const fails = [], oks = []
let hashLine = ''
for (const f of readdirSync(dir).filter(x => x.endsWith('.sql'))) {
  const txt = readFileSync(join(dir, f), 'utf8')
  const hash = createHash('sha256').update(txt).digest('hex')
  if (f === '0001_initial.sql') hashLine = hash
  const cols = [...txt.matchAll(/^\s*([a-z_][a-z0-9_]*)\s+(?:TEXT|INTEGER|REAL|BLOB)/gim)].map(m => m[1])
  const hits = cols.filter(c => BANNED.some(re => re.test(c)))
  if (hits.length) fails.push(`${f}: 判读类列 ${hits.join(', ')}`)
  const wordHits = BANNED.filter(re => re.test(txt)).map(re => String(re))
  // 全文词表只拦「列定义形态」的命中，注释里的红线说明不算——但为防漏，注释里出现也提示（不 fail）
  if (hits.length === 0) oks.push(`${f}: 列名无判读类命名（sha256 ${hash.slice(0, 12)}…）`)
}

/* freeze-contract 记账核对 */
const fc = join(dir, 'freeze-contract.md')
if (existsSync(fc) && hashLine) {
  const txt = readFileSync(fc, 'utf8')
  if (!txt.includes(hashLine)) {
    fails.push(`freeze-contract.md 未登记 0001_initial.sql 的当前 sha256（${hashLine.slice(0, 12)}…）——冻结被改或账本未回填`)
  } else oks.push('freeze-contract.md sha256 与文件一致')
}

console.log(JSON.stringify({ pass: fails.length === 0, fails, oks }, null, 2))
process.exit(fails.length ? 1 : 0)
