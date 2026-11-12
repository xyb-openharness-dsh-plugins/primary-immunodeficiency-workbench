/**
 * 读模型：把 SQLite 的行还原成 prototypes/v0.2/demo-data.js 同一形状（parity 唯一验收标准）。
 *
 * 规则：
 *   - 裸 SELECT 一律 ORDER BY rowid（家族契约）；lab_results 另有 (profile_key, metric_key, measured_on)
 *     读序索引，输出顺序仍以 rowid 为准（与演示数据插入顺序一致）；
 *   - 私密在 bootstrap 默认不过滤——返回全量、私密标记随行返回，页面按原型口径显示「私密」徽标、
 *     聚合只算共享行（sharedOnly，与原型同一份函数语义）；导出与 AI 两个出口走 bootstrapForExit，
 *     在读模型层剥掉 is_private=1 的行；
 *   - 派生值（感染中第 N 天 / 近 90 天感染次数 / 下次输注推算）由页面读时算（与原型同一份函数），
 *     不落库、不在此重复实现；
 *   - id 还原：演示数据的字符串 id（a-inf-1…）不落库（表主键自增），读时按 rowid 序确定性合成：
 *     前缀取 profile_key 去掉 demo- 前缀，逐表重新编号——与种子写入顺序一致；reports 的
 *     report_key 列存了演示字符串 id，优先原样返回（同一报告历次修订同 key）。
 */

/** profile_key（demo-a）→ 演示 id 前缀（a）。 */
function idPrefix(profileKey) {
  return String(profileKey || '').replace(/^demo-/, '');
}

function synthId(pre, tag, i) {
  return `${pre}-${tag}${i + 1}`;
}

/** agent_form（IVIG/SCIG/复诊/其他）→ 演示口径 kind（'IVIG 输注'/'SCIG 输注'/'复诊'/'其他'）。 */
const KIND_OF = { IVIG: 'IVIG 输注', SCIG: 'SCIG 输注', 复诊: '复诊', 其他: '其他' };

export function readBootstrap(db) {
  const rows = db.prepare('SELECT * FROM subjects ORDER BY rowid').all();
  const today = new Date();
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return {
    TODAY: todayText,
    profiles: rows.map((pr) => readSubject(db, pr)),
  };
}

export function readSubject(db, pr) {
  const key = pr.profile_key;
  const pre = idPrefix(key);

  const infections = db.prepare('SELECT * FROM infection_events WHERE profile_key = ? ORDER BY rowid').all(key).map((f, i) => ({
    id: synthId(pre, 'inf-', i), start: f.start_date, end: f.end_date ?? null,
    site: f.site_text ?? null, pathogen: f.pathogen_text ?? null, meds: f.anti_infective_text ?? null,
    note: f.note ?? null, private: !!f.is_private,
  }));

  const infusions = db.prepare('SELECT * FROM infusion_events WHERE profile_key = ? ORDER BY rowid').all(key).map((t, i) => ({
    id: synthId(pre, 'iv-', i), date: t.event_date, kind: KIND_OF[t.agent_form] || '其他',
    name: t.name ?? '', note: t.note ?? '', private: !!t.is_private,
  }));

  const labs = db.prepare('SELECT * FROM lab_results WHERE profile_key = ? ORDER BY rowid').all(key).map((l, i) => ({
    id: synthId(pre, 'lab-', i), metric: l.metric_key, date: l.measured_on ?? null,
    value: l.value ?? l.value_text, unit: l.unit || '', method: l.method || '', org: l.org || '', private: !!l.is_private,
  }));

  const vaccines = db.prepare('SELECT * FROM vaccine_consents WHERE profile_key = ? ORDER BY rowid').all(key).map((v, i) => ({
    id: synthId(pre, 'vx-', i), date: v.consent_date ?? null, who: v.who_text ?? '', words: v.words_text ?? '', private: !!v.is_private,
  }));

  const meds = db.prepare('SELECT * FROM meds WHERE profile_key = ? ORDER BY rowid').all(key).map((m) => ({
    name: m.name, schedule: m.schedule_text || '', note: m.note || '', since: m.since_on ?? null,
  }));

  const reports = db.prepare('SELECT * FROM reports WHERE profile_key = ? ORDER BY rowid').all(key).map((r) => ({
    id: r.report_key || `r${r.id}`, title: r.title, date: r.reported_on ?? null, kind: r.kind || '',
    source: r.source_state || '', keydesc: r.key_finding ?? '', private: !!r.is_private,
  }));

  const questions = db.prepare('SELECT * FROM visit_questions WHERE profile_key = ? ORDER BY rowid').all(key).map((q, i) => ({
    id: synthId(pre, 'q-', i), q: q.question, addedOn: q.added_on ?? null, answered: q.answered_on != null, private: !!q.is_private,
  }));

  const hospitals = db.prepare('SELECT * FROM hospitals WHERE profile_key = ? ORDER BY rowid').all(key).map((h, i) => ({
    id: synthId(pre, 'h-', i), name: h.name, dept: h.dept || '', contact: h.contact || '', ver: h.ver || 1,
  }));

  const mindRows = db.prepare('SELECT * FROM mind_notes WHERE profile_key = ? ORDER BY rowid').all(key);
  const mind = { feel: [], family: [] };
  for (const m of mindRows) {
    const item = { d: m.noted_on ?? null, text: m.body, author: m.author || '', private: !!m.is_private };
    if (m.kind === 'family') mind.family.push(item);
    else mind.feel.push(item);
  }

  /* profile 键值（全部 fact_key 泛化读取，病种字段集由 demo 唯一源决定）+ 医生行动计划（subjects.action_plan 原话） */
  const facts = {};
  for (const f of db.prepare('SELECT * FROM profile_facts WHERE profile_key = ? ORDER BY rowid').all(key)) {
    facts[f.fact_key] = f.fact_value;
  }
  const profile = {};
  for (const k of Object.keys(facts)) {
    if (k === '医生行动计划原话') continue; /* action_plan 走 subjects 列，仍按 demo-data 键序追加在末尾 */
    profile[k] = facts[k];
  }
  if (pr.action_plan != null) profile['医生行动计划原话'] = pr.action_plan;

  return {
    id: key, name: pr.name || '', tag: pr.meta || '', isDemo: !!pr.is_demo,
    profile, infections, infusions, labs, vaccines, meds, reports, questions, hospitals, mind,
  };
}

/** 私密行剥离（深拷贝）：导出与 AI 上下文出口在读模型层强制过滤 is_private=1。 */
function stripPrivate(data) {
  const clone = JSON.parse(JSON.stringify(data));
  for (const p of clone.profiles || []) {
    p.infections = (p.infections || []).filter((x) => !x.private);
    p.infusions = (p.infusions || []).filter((x) => !x.private);
    p.labs = (p.labs || []).filter((x) => !x.private);
    p.vaccines = (p.vaccines || []).filter((x) => !x.private);
    p.questions = (p.questions || []).filter((x) => !x.private);
    p.reports = (p.reports || []).filter((x) => !x.private);
    if (p.mind) {
      p.mind.feel = (p.mind.feel || []).filter((x) => !x.private);
      p.mind.family = (p.mind.family || []).filter((x) => !x.private);
    }
  }
  return clone;
}

/**
 * 三出口读法（与原型「看板摘要 / 导出 / AI 上下文」共用同一过滤语义）：
 *   - 'dashboard'：页面渲染需要私密标记（「私密」徽标与"私密 N 条未计入"提示），返回全量；
 *     摘要只统计共享行，由页面 sharedOnly 完成。
 *   - 'export' / 'ai'：读模型层剥掉私密行，调用方拿到的数据里不存在 is_private=1 的内容。
 */
export function bootstrapForExit(db, exit = 'dashboard') {
  const full = readBootstrap(db);
  if (exit === 'export' || exit === 'ai') return stripPrivate(full);
  return full;
}
