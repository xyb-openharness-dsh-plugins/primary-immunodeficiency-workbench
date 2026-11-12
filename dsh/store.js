/**
 * 开库 / 迁移 / 关库。测试用 `:memory:`，生产用资料根下的 sqlite 文件。
 *
 * 三条硬约束（DEV-REQUIREMENTS §三，与家族各仓同一口径）：
 *   ① 迁移只增不改：schema/00*.sql 按编号全部执行；冻结后不得修改，只新增 0002+；
 *   ② 迁移 ledger：记录已应用的迁移编号与 sha256，重复执行幂等；
 *   ③ 裸 SELECT 必须 ORDER BY rowid。
 */
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const SCHEMA_DIR = join(HERE, '..', 'schema')

export function migrationFiles(dir = SCHEMA_DIR) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort()
}

export function sha256(text) {
  return createHash('sha256').update(text).digest('hex')
}

export function openStore(file) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true })
  const db = new DatabaseSync(file)
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec('PRAGMA journal_mode = WAL;')
  return db
}

/** 幂等迁移：已应用跳过；未应用的整体在一个事务里执行。返回本次应用的迁移清单。 */
export function migrate(db, dir = SCHEMA_DIR) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    migration TEXT PRIMARY KEY, sha256 TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`)
  const applied = new Set(db.prepare('SELECT migration FROM schema_migrations ORDER BY rowid').all().map((r) => r.migration))
  const ran = []
  for (const f of migrationFiles(dir)) {
    if (applied.has(f)) continue
    const sql = readFileSync(join(dir, f), 'utf8')
    db.exec('BEGIN;')
    try {
      db.exec(sql)
      db.prepare('INSERT INTO schema_migrations (migration, sha256) VALUES (?, ?)').run(f, sha256(sql))
      db.exec('COMMIT;')
      ran.push(f)
    } catch (error) {
      db.exec('ROLLBACK;')
      throw new Error(`迁移 ${f} 失败：${error?.message ?? error}`)
    }
  }
  return ran
}

export function closeStore(db) {
  try { db?.close() } catch { /* 已关闭不拦截 */ }
}
