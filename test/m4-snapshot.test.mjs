/* M4 快照对账：manifest = jsonl = sqlite 三方计数一致；逐字段映射断言；FAILED 如实存在 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const HERE = dirname(fileURLToPath(import.meta.url))
const DIR = join(HERE, '..', 'research', 'primary-immunodeficiency')

test('四件套齐：manifest / jsonl / sqlite / FAILED.md', () => {
  for (const f of ['manifest.json', 'snapshot-2026.jsonl', 'pid_clinical_snapshot_2026.sqlite', 'FAILED.md']) {
    assert.ok(existsSync(join(DIR, f)), `缺 ${f}`)
  }
})

test('manifest = jsonl = sqlite 计数一致，且 jsonl sha256 与 manifest 记录一致', () => {
  const manifest = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8'))
  const jsonlRaw = readFileSync(join(DIR, 'snapshot-2026.jsonl'), 'utf8')
  const jsonl = jsonlRaw.split('\n').filter(Boolean).map(l => JSON.parse(l))
  const db = new DatabaseSync(join(DIR, 'pid_clinical_snapshot_2026.sqlite'), { readOnly: true })
  const dbRows = db.prepare('SELECT COUNT(*) c FROM snapshot_trials').get().c
  assert.equal(manifest.snapshot.records, jsonl.length)
  assert.equal(manifest.snapshot.dbRows, dbRows)
  assert.equal(jsonl.length, dbRows)
  const sha = createHash('sha256').update(jsonlRaw).digest('hex')
  assert.equal(manifest.snapshot.sha256, sha)
})

test('逐字段映射断言：每条记录有 recordId/registry/statusNote/source，statusNote 带未核实标注', () => {
  const jsonl = readFileSync(join(DIR, 'snapshot-2026.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
  assert.ok(jsonl.length > 0, '样本非空（先证有东西）')
  for (const r of jsonl) {
    assert.ok(/^NCT\d{6,}$/.test(r.recordId), `recordId 应为 NCT 号：${r.recordId}`)
    assert.equal(r.registry, 'NCT')
    assert.ok(r.title && r.title.length > 5)
    assert.ok(r.statusNote.includes('未核实'), '登记状态一律未核实')
    assert.equal(r.source, 'ClinicalTrials.gov API v2')
  }
})

test('sqlite 行与 jsonl 行逐字段相等（同一份数据两种形态）', () => {
  const db = new DatabaseSync(join(DIR, 'pid_clinical_snapshot_2026.sqlite'), { readOnly: true })
  const rows = db.prepare('SELECT * FROM snapshot_trials ORDER BY rowid').all()
  const jsonl = readFileSync(join(DIR, 'snapshot-2026.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
  assert.equal(rows.length, jsonl.length)
  for (let i = 0; i < rows.length; i++) {
    assert.equal(rows[i].record_id, jsonl[i].recordId)
    assert.equal(rows[i].title, jsonl[i].title)
    assert.equal(rows[i].study_type, jsonl[i].studyType)
    assert.equal(rows[i].status_note, jsonl[i].statusNote)
  }
})

test('FAILED.md 如实记录未查通道（unified-trial-mcp 四通道）', () => {
  const failed = readFileSync(join(DIR, 'FAILED.md'), 'utf8')
  assert.ok(failed.includes('unified-trial-mcp:ictrp'))
  assert.ok(failed.includes('未查过，不写零结果'))
})
