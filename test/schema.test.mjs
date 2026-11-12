/* M3 数据模型测试：内存全建 + 判读列断言 + 冻结合同 sha256 一致 + 读序契约 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openStore, migrate } from '../dsh/store.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const SCHEMA_DIR = join(ROOT, 'schema')

const EXPECTED_TABLES = [
  'subjects', 'section_titles',
  'metric_defs', 'lab_results', 'metric_group_titles',
  'reports', 'hospitals', 'visit_questions', 'mind_notes', 'viewpoints', 'documents', 'meds',
  'infection_events', 'infusion_events', 'vaccine_consents', 'profile_facts',
  'import_batches', 'import_candidates', 'import_conflicts',
]

test('0001 在内存库全量迁移成功，19 张业务表全部建成', () => {
  const db = openStore(':memory:')
  const ran = migrate(db)
  assert.ok(ran.includes('0001_initial.sql'), '应执行 0001')
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name)
  for (const t of EXPECTED_TABLES) assert.ok(tables.includes(t), `缺表 ${t}`)
  // 幂等：重复 migrate 不再执行任何迁移
  const ran2 = migrate(db)
  assert.equal(ran2.length, 0, '重复迁移应幂等跳过')
})

test('判读列断言：全表全列无派生判定命名（diagnosis/risk_level/activity_score/severity/stage 等）', () => {
  const sql = readFileSync(join(SCHEMA_DIR, '0001_initial.sql'), 'utf8')
  const cols = [...sql.matchAll(/^\s*(\w+)\s+(?:TEXT|INTEGER|REAL)/gm)].map(m => m[1].toLowerCase())
  const forbidden = ['diagnosis', 'diagnosis_text', 'risk_level', 'risk', 'activity_score', 'severity', 'stage', 'grade', 'prognosis', 'mrd', 'relapse']
  for (const c of cols) {
    assert.ok(!forbidden.includes(c), `判读列违规：${c}`)
  }
})

test('freeze-contract 的 sha256 与 0001_initial.sql 实际一致（改冻结文件必红）', () => {
  const actual = createHash('sha256').update(readFileSync(join(SCHEMA_DIR, '0001_initial.sql'))).digest('hex')
  const contract = readFileSync(join(SCHEMA_DIR, 'freeze-contract.md'), 'utf8')
  const declared = (contract.match(/sha256：`([0-9a-f]{64})`/) || [])[1]
  assert.ok(declared, 'freeze-contract 应声明 sha256')
  assert.equal(declared, actual)
})

test('迁移账本记录 sha256，可复核对账', () => {
  const db = openStore(':memory:')
  migrate(db)
  const rows = db.prepare('SELECT migration, sha256 FROM schema_migrations ORDER BY rowid').all()
  const fileSha = createHash('sha256').update(readFileSync(join(SCHEMA_DIR, '0001_initial.sql'))).digest('hex')
  const row = rows.find(r => r.migration === '0001_initial.sql')
  assert.equal(row.sha256, fileSha)
})

test('subjects.is_demo 列存在且默认 0；infection_events 支持 author_role 双视角与 NULL 结束日期', () => {
  const db = openStore(':memory:')
  migrate(db)
  const ins = db.prepare("INSERT INTO subjects (profile_key, name, created_on) VALUES ('k1','测试','2026-11-13')")
  ins.run()
  const s = db.prepare("SELECT is_demo FROM subjects WHERE profile_key='k1'").get()
  assert.equal(s.is_demo, 0)
  db.prepare("INSERT INTO infection_events (profile_key, start_date, end_date, site_text, author_role) VALUES ('k1','2026-10-28',NULL,'肺','家长代记')").run()
  const inf = db.prepare("SELECT end_date, author_role FROM infection_events WHERE profile_key='k1' ORDER BY rowid").get()
  assert.equal(inf.end_date, null, '感染中=显式 NULL，不用空串')
  assert.equal(inf.author_role, '家长代记')
})
