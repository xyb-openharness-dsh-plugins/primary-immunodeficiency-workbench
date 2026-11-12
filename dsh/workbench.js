/**
 * 领域服务：把「资料根 → 开库 → 迁移 → 播种 → 档案读写」收在一个可测对象里。
 * dsh/index.js 只留 wiring；业务读模型（readmodels）随 M3 定稿后接入。
 */
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { openStore, migrate, closeStore } from './store.js'
import { seedDemoData, hasDemoData } from './demo.js'

export const DB_FILE = 'primary-immunodeficiency.sqlite3'

export class Workbench {
  /**
   * @param {object} options
   * @param {string} options.root 用户资料目录（必须由用户明确指定；调用方负责校验拒绝清单）
   * @param {boolean} [options.seedDemo] 首次打开是否写入演示档案（默认 true，仅空库生效）
   */
  constructor({ root, seedDemo = true } = {}) {
    if (typeof root !== 'string' || root.trim() === '') throw new Error('Workbench 需要 root（用户资料目录）')
    this.root = root
    this.dbFile = join(root, DB_FILE)
    this.db = null
    this.seedDemo = seedDemo
  }

  open() {
    if (this.db) return this
    this.db = openStore(this.dbFile)
    this.migrations = migrate(this.db)
    this.seeded = this.seedDemo ? seedDemoData(this.db) : { skipped: true, profiles: 0 }
    return this
  }

  close() { closeStore(this.db); this.db = null }

  get dataRoot() { return this.root }

  /** 档案列表（裸 SELECT 带 ORDER BY rowid，家族口径）。 */
  listProfiles() {
    this.open()
    return this.db.prepare(
      'SELECT profile_key, name, meta, headline, dash_keys, created_on, is_demo FROM subjects ORDER BY rowid'
    ).all().map((row) => ({
      ...row,
      isDemo: row.is_demo === 1,
      meta: safeJson(row.meta, {}),
      dashKeys: safeJson(row.dash_keys, []),
    }))
  }

  /** 新建真实档案：is_demo 恒写 0，与演示档案并存但永不混淆。 */
  createSubject({ name, meta, headline, dashKeys } = {}) {
    const trimmed = typeof name === 'string' ? name.trim() : ''
    if (!trimmed) throw new Error('档案名不能为空')
    this.open()
    const profileKey = randomUUID()
    const createdOn = new Date().toISOString().slice(0, 10)
    this.db.prepare(
      'INSERT INTO subjects (profile_key, name, meta, headline, dash_keys, created_on, is_demo) VALUES (?,?,?,?,?,?,0)'
    ).run(
      profileKey, trimmed,
      JSON.stringify(meta && typeof meta === 'object' ? meta : {}),
      typeof headline === 'string' ? headline : '',
      JSON.stringify(Array.isArray(dashKeys) ? dashKeys : []),
      createdOn,
    )
    return this.getProfile(profileKey)
  }

  getProfile(profileKey) {
    this.open()
    const row = this.db.prepare(
      'SELECT profile_key, name, meta, headline, dash_keys, created_on, is_demo FROM subjects WHERE profile_key = ?'
    ).get(profileKey)
    if (!row) return null
    return { ...row, isDemo: row.is_demo === 1, meta: safeJson(row.meta, {}), dashKeys: safeJson(row.dash_keys, []) }
  }

  /** 删除演示档案（只删 is_demo=1 的行）；真实档案永不由此函数触碰。 */
  removeDemo() {
    this.open()
    const info = this.db.prepare('DELETE FROM subjects WHERE is_demo = 1').run()
    return { removed: info.changes }
  }

  bootstrap() {
    this.open()
    return {
      version: this.version ?? null,
      dataRoot: this.root,
      profiles: this.listProfiles(),
      hasDemo: hasDemoData(this.db),
      demoSeeded: this.seeded ?? { skipped: true },
    }
  }
}

function safeJson(text, fallback) {
  try { return JSON.parse(text) } catch { return fallback }
}
