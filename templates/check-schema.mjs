/* 判读列断言 + schema 冻结合同（模板，2026-11-05 从 takayasu-workbench 回收，L59）
 * 自适应：不限表数；freeze-contract.md 的 sha256 必须与 schema/0001_initial.sql 一致。
 * 接入：复制进项目 scripts/check-schema.mjs 并挂进 check 链（package.json scripts.check 追加）。
 */
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = process.argv[2] ? resolve(process.argv[2]) : ROOT
const sqlPath = join(target, 'schema/0001_initial.sql')
if (!existsSync(sqlPath)) { console.log(JSON.stringify({ check: 'schema', skip: 'no schema dir yet' })); process.exit(0) }
const sql = readFileSync(sqlPath, 'utf-8')
const BANNED = /diagnosis|risk_level|activity_score|severity|stenosis_grade|flare_flag|remission_flag|relapse|eligible|verdict|recommend/i
const db = new DatabaseSync(':memory:')
db.exec(sql)
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name)
const hits = []
for (const t of tables) for (const c of db.prepare(`PRAGMA table_info(${t})`).all()) if (BANNED.test(c.name)) hits.push(`${t}.${c.name}`)
const sha = createHash('sha256').update(sql).digest('hex')
const freezePath = join(target, 'schema/freeze-contract.md')
const freezeOk = existsSync(freezePath) && readFileSync(freezePath, 'utf-8').includes(sha)
const pass = hits.length === 0 && tables.length >= 15 && freezeOk
console.log(JSON.stringify({ check: 'schema', tables: tables.length, judgementHits: hits, sha256: sha.slice(0, 16) + '…', freezeOk, pass }))
process.exit(pass ? 0 : 1)
