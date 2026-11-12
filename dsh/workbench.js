/**
 * 领域服务：把「数据根 → 开库 → 迁移 → 播种 → 读模型」收在一个可测对象里。
 *
 * 为什么单独一层：`dsh/index.js` 要 import Schemastery（宿主提供的 peer，本仓装不上），
 * 那一行会让整个入口不可单测。把可测逻辑放这里，入口只留 wiring。
 *
 * schema/0001 已冻结且无 app_setting 表：资料目录的持久化由调用方（dsh/index.js）落在
 * root/data-root.json；本类只保证「切目录先开新库成功再替换，失败回滚到原库」。
 */
import { join } from 'node:path';
import { openStore, closeStore, migrate } from './store.js';
import { seedDemoData, hasDemoData } from './demo.js';
import { readBootstrap, bootstrapForExit } from './readmodels.js';
import { DB_FILE, HOME_DIR } from '../lib/identity.js';
import { version, displayVersion, build as buildDate } from '../lib/version.js';

export class Workbench {
  /**
   * @param {object} options
   * @param {string} options.root      用户资料目录（必须由用户明确指定；调用方负责校验）
   * @param {boolean} [options.seedDemo] 首次打开是否写入演示数据（默认 true，仅空库生效）
   */
  constructor({ root, seedDemo = true } = {}) {
    if (typeof root !== 'string' || root.trim() === '') throw new Error('Workbench 需要 root（用户资料目录）');
    this.root = root;
    this.dbFile = join(root, DB_FILE);
    this.db = null;
    this.seedDemo = seedDemo;
  }

  /** 打开（幂等）。迁移与播种都在这里完成。 */
  open() {
    if (this.db) return this;
    this.db = openStore(this.dbFile);
    this.migrations = migrate(this.db);
    this.seeded = this.seedDemo ? seedDemoData(this.db) : { skipped: true, profiles: 0 };
    return this;
  }

  get dataRoot() { return this.root }

  /**
   * 切换资料目录：先开新库成功再替换，失败回滚到原库（不能把用户的数据根弄丢）。
   * 目录合法性由调用方（服务端）校验；这里只保证「切不过去就退回去」。
   */
  setDataRoot(nextRoot) {
    this.open();
    const dir = String(nextRoot || '').trim();
    if (!dir || dir === this.root) return this.root;
    const prevRoot = this.root;
    const prevFile = this.dbFile;
    closeStore(this.db);
    this.db = null;
    try {
      this.dbFile = join(dir, DB_FILE);
      this.db = openStore(this.dbFile);
      this.migrations = migrate(this.db);
      this.root = dir;
      this.seeded = this.seedDemo ? seedDemoData(this.db) : { skipped: true, profiles: 0 };
      return this.root;
    } catch (error) {
      this.root = prevRoot;
      this.dbFile = prevFile;
      try { this.db = openStore(this.dbFile); } catch { this.db = null; }
      throw error;
    }
  }

  /**
   * 新建患者档案（真实用户数据，不是 demo）。
   * profile_key 用 local-<时间戳>：不与 demo 的 a/b 撞键，也不依赖姓名（同名不同人是两个人）。
   * is_demo 恒写 0：演示档案与真实档案并存但永不混淆。
   */
  createSubject({ name, meta } = {}) {
    this.open();
    const cleanName = String(name || '').trim();
    if (!cleanName) throw new Error('请填写档案名（可以是昵称）');
    if (cleanName.length > 40) throw new Error('档案名太长（≤40 字）');
    const key = 'local-' + Date.now().toString(36);
    this.db.prepare('INSERT INTO subjects (profile_key, name, meta, headline, action_plan, dash_keys, created_on, is_demo) VALUES (?,?,?,?,?,?,?,0)')
      .run(key, cleanName, String(meta || '').trim() || '我自己记录', null, null, null, new Date().toISOString().slice(0, 10));
    return { profileKey: key, name: cleanName };
  }

  deleteSubject(profileKey) {
    this.open();
    const key = String(profileKey || '');
    if (!key || key.startsWith('demo-')) throw new Error('演示档案不删除；只能删自己建的档案');
    this.db.prepare('DELETE FROM subjects WHERE profile_key = ? AND is_demo = 0').run(key);
    return { deleted: key };
  }

  close() {
    if (this.db) { closeStore(this.db); this.db = null; }
  }

  get stats() {
    if (!this.db) return null;
    const subjects = this.db.prepare('SELECT COUNT(*) c FROM subjects').get().c;
    const infections = this.db.prepare('SELECT COUNT(*) c FROM infection_events').get().c;
    const infusions = this.db.prepare('SELECT COUNT(*) c FROM infusion_events').get().c;
    const labs = this.db.prepare('SELECT COUNT(*) c FROM lab_results').get().c;
    const metrics = this.db.prepare('SELECT COUNT(*) c FROM metric_defs').get().c;
    return { profiles: subjects, metrics, labs, infections, infusions, hasDemo: hasDemoData(this.db) };
  }

  /** bootstrap：读模型还原 demo 形状（parity 由 test/bootstrap-parity.test.mjs 断言）。 */
  bootstrap() {
    this.open();
    return readBootstrap(this.db);
  }

  /** 导出 / AI 上下文出口：读模型层剥掉私密行。 */
  bootstrapForExit(exit = 'dashboard') {
    this.open();
    return bootstrapForExit(this.db, exit);
  }

  /** 供宿主 /health 用：只报事实，不报「是否已验证」。 */
  status() {
    return {
      version, displayVersion, buildDate,
      homeDir: HOME_DIR,
      dbFile: DB_FILE,
      root: this.root,
      capabilities: ['bootstrap', 'health', 'data-root', 'subjects'],
      stats: this.stats,
      seeded: this.seeded ?? null,
      migrations: this.migrations ?? null,
    };
  }

  /** 演示数据重载（幂等；force 才清空重播，仅供开发用）。 */
  reloadDemo(force = false) {
    this.open();
    return seedDemoData(this.db, { force });
  }

  get hasData() {
    this.open();
    return hasDemoData(this.db);
  }
}

export { readBootstrap, bootstrapForExit, seedDemoData, openStore, closeStore };
