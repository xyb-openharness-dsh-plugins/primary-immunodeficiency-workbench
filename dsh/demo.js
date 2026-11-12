/**
 * 演示数据种子（真·唯一源 = prototypes/v0.2/demo-data.js；装包后读 public/demo-data.js 同字节副本）。
 * 首次开库（空库）把 A/B 两套合成档案（is_demo=1）连同全部业务数据灌库；幂等：非空库跳过（force 可重灌）。
 *
 * 本文件不手抄数据——parity 测试（test/bootstrap-parity.test.mjs）直接断言
 * readBootstrap 输出与 demo-data.js canonical 关键字段一致，改数据只改 demo-data.js 一处。
 *
 * 对应关系（schema/0001_initial.sql，19 表冻结版）：
 *   subjects（meta=标签行 tag，action_plan=医生行动计划原话）+ profile_facts（profile 各键值）
 *   infection_events（infections：site/pathogen/meds→anti_infective_text 照录）
 *   infusion_events（infusions：kind 'IVIG 输注'→agent_form 'IVIG'，'SCIG 输注'→'SCIG'，'复诊'→'复诊'，其余'其他'）
 *   lab_results（labs；metric_defs 种子与 demo-data.metricDefs 一致，metric_group_titles 同源）
 *   vaccine_consents（vaccines：医生原话一字不改）/ meds / visit_questions / hospitals /
 *   reports（report_key=演示字符串 id，同一报告历次修订同 key）/ mind_notes（feel/family）
 * 演示字符串 id（a-inf-1…）不落库（主键自增），读模型按 rowid 序确定性合成（见 readmodels.js）。
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** 唯一源加载：优先仓内原型目录，装包后 prototypes 不随包 → 读 public 同字节副本 */
function loadDemoData() {
  for (const rel of ['../prototypes/v0.2/demo-data.js', '../public/demo-data.js']) {
    try {
      const src = readFileSync(join(HERE, rel), 'utf8');
      return new Function('window', src + '; return window.DEMO_DATA;')({});
    } catch { /* 尝试下一个候选 */ }
  }
  throw new Error('demo-data.js 不可读（prototypes 与 public 都缺失）');
}

/** 演示 kind（'IVIG 输注'）→ schema agent_form（'IVIG'，枚举 IVIG/SCIG/复诊/其他）。 */
function agentFormOf(kind) {
  const k = String(kind || '');
  if (k === 'IVIG 输注') return 'IVIG';
  if (k === 'SCIG 输注') return 'SCIG';
  if (k === '复诊') return '复诊';
  return '其他';
}

export function seedDemoData(db, { force = false } = {}) {
  const existing = db.prepare('SELECT COUNT(*) c FROM subjects').get().c;
  if (existing > 0 && !force) return { skipped: true, profiles: existing };
  if (force) {
    for (const t of ['import_conflicts', 'import_candidates', 'import_batches', 'profile_facts',
      'vaccine_consents', 'infusion_events', 'infection_events', 'meds', 'documents', 'viewpoints', 'mind_notes',
      'visit_questions', 'hospitals', 'reports', 'lab_results', 'metric_group_titles',
      'section_titles', 'subjects', 'metric_defs']) {
      db.prepare(`DELETE FROM ${t}`).run();
    }
  }
  const D = loadDemoData();

  /* 指标目录：与 demo-data.metricDefs 一致（key=IGG/IGA/…，db 键只作映射不做存储） */
  const mdIns = db.prepare('INSERT INTO metric_defs (key, title, category, unit, color, ord) VALUES (?,?,?,?,?,?)');
  for (const d of D.metricDefs ?? []) mdIns.run(d.key, d.title, d.category, d.unit, d.color, d.ord);

  const subIns = db.prepare('INSERT INTO subjects (profile_key, name, meta, headline, action_plan, dash_keys, created_on, is_demo) VALUES (?,?,?,?,?,?,?,1)');
  const factIns = db.prepare('INSERT INTO profile_facts (profile_key, fact_key, fact_value, fact_date, ver) VALUES (?,?,?,?,1)');
  const groupIns = db.prepare('INSERT INTO metric_group_titles (profile_key, category, title, ord) VALUES (?,?,?,?)');
  const infIns = db.prepare('INSERT INTO infection_events (profile_key, start_date, end_date, site_text, pathogen_text, anti_infective_text, note, is_private, author_role, ver) VALUES (?,?,?,?,?,?,?,?,?,1)');
  const ivIns = db.prepare('INSERT INTO infusion_events (profile_key, event_date, agent_form, dose_text, org, reaction_text, name, note, is_private, author_role, ver) VALUES (?,?,?,?,?,?,?,?,?,?,1)');
  const labIns = db.prepare('INSERT INTO lab_results (profile_key, metric_key, measured_on, value, value_text, unit, method, org, is_private, note, ver) VALUES (?,?,?,?,?,?,?,?,?,?,1)');
  const vxIns = db.prepare('INSERT INTO vaccine_consents (profile_key, consent_date, who_text, words_text, is_private, ver) VALUES (?,?,?,?,?,1)');
  const medIns = db.prepare('INSERT INTO meds (profile_key, name, schedule_text, since_on, note, ver) VALUES (?,?,?,?,?,1)');
  const qIns = db.prepare('INSERT INTO visit_questions (profile_key, question, added_on, answered_on, is_private, ver) VALUES (?,?,?,?,?,1)');
  const hpIns = db.prepare('INSERT INTO hospitals (profile_key, name, dept, contact, ver) VALUES (?,?,?,?,?)');
  const repIns = db.prepare('INSERT INTO reports (profile_key, report_key, title, kind, reported_on, source_state, key_finding, is_private, ver) VALUES (?,?,?,?,?,?,?,?,1)');
  const mindIns = db.prepare('INSERT INTO mind_notes (profile_key, kind, noted_on, body, author, is_private, ver) VALUES (?,?,?,?,?,?,1)');

  /* metricDefs 的 db 小写键 / 展示键 → schema metric_defs.key（IGG）映射（lab 行两种键都能对上） */
  const dbKey = {};
  for (const d of D.metricDefs ?? []) { dbKey[d.db] = d.key; dbKey[d.key] = d.key; }

  for (const p of D.profiles ?? []) {
    subIns.run(p.id, p.name, p.tag ?? null, null, p.profile?.['医生行动计划原话'] ?? null, null, D.TODAY);
    /* 指标分组标题：指标页与一图秀共用同一目录（组名/顺序/项数一致） */
    for (const [i, g] of (D.metricGroups ?? []).entries()) groupIns.run(p.id, g.key, g.title, i);
    for (const [k, v] of Object.entries(p.profile ?? {})) {
      if (k === '医生行动计划原话') continue; /* 已入 subjects.action_plan */
      if (v == null) continue; /* profile_facts.fact_value NOT NULL；显式未知不入行 */
      factIns.run(p.id, k, String(v));
    }
    for (const f of p.infections ?? []) {
      infIns.run(p.id, f.start, f.end ?? null, f.site ?? null, f.pathogen ?? null, f.meds ?? null, f.note ?? null, f.private ? 1 : 0, null);
    }
    for (const t of p.infusions ?? []) {
      ivIns.run(p.id, t.date, agentFormOf(t.kind), null, null, null, t.name ?? null, t.note ?? null, t.private ? 1 : 0, null);
    }
    for (const l of p.labs ?? []) {
      if (!dbKey[l.metric]) continue; /* metric_defs 外的键会破坏外键口径 */
      const isNumeric = typeof l.value === 'number' || /^\d+(\.\d+)?$/.test(String(l.value ?? ''));
      labIns.run(p.id, dbKey[l.metric], l.date ?? null, isNumeric ? Number(l.value) : null, isNumeric ? null : String(l.value ?? ''), l.unit ?? null, l.method ?? null, l.org ?? null, l.private ? 1 : 0, null);
    }
    for (const v of p.vaccines ?? []) vxIns.run(p.id, v.date ?? null, v.who ?? null, v.words, v.private ? 1 : 0);
    for (const m of p.meds ?? []) medIns.run(p.id, m.name, m.schedule ?? null, m.since ?? null, m.note ?? null);
    for (const q of p.questions ?? []) qIns.run(p.id, q.q, q.addedOn ?? null, q.answered ? D.TODAY : null, q.private ? 1 : 0);
    for (const h of p.hospitals ?? []) hpIns.run(p.id, h.name, h.dept ?? '', h.contact ?? '', h.ver ?? 1);
    for (const r of p.reports ?? []) repIns.run(p.id, r.id ?? null, r.title, r.kind ?? null, r.date ?? null, r.source ?? null, r.keydesc || null, r.private ? 1 : 0);
    for (const x of p.mind?.feel ?? []) mindIns.run(p.id, 'feel', x.d ?? null, x.text, x.author ?? null, x.private ? 1 : 0);
    for (const x of p.mind?.family ?? []) mindIns.run(p.id, 'family', x.d ?? null, x.text, x.author ?? null, x.private ? 1 : 0);
    for (const d of p.docs ?? []) { /* 演示数据无 documents 行；保留挂点 */ void d; }
  }

  const n = db.prepare('SELECT COUNT(*) c FROM subjects').get().c;
  return { skipped: false, profiles: n };
}

export function hasDemoData(db) {
  return db.prepare('SELECT COUNT(*) c FROM subjects WHERE is_demo = 1').get().c > 0;
}
