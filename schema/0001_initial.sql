-- 小御宝 ImmuPal · 原发性免疫缺陷病工作台 · 0001 初始 schema（M3 冻结版）
-- 结构移植自 cidp-workbench schema（家族模板移植 + 病种语义重写）。
-- 硬约束：
--   * 无判读列：没有 diagnosis / risk_level / activity_score / severity / stage 类派生判定入库；
--   * 显式 null 不用空串冒充未知；私密用 is_private；版本链 ver + superseded_by（无裸删除）；
--   * 分类不进趋势（metric_defs.category 仅作分组展示键）；
--   * 裸 SELECT 读时 ORDER BY rowid（读模型层契约）；
--   * 术语：免疫球蛋白「替代治疗」（replacement therapy），列注释不出现「置换」。

/* ---------- 档案级（2） ---------- */

CREATE TABLE subjects (
  profile_key   TEXT PRIMARY KEY,
  name          TEXT,
  meta          TEXT,            -- JSON：代记视角（本人/家长代记）、出生年份等事实性描述
  headline      TEXT,            -- 看板顶部一句事实摘要（不判定）
  action_plan   TEXT,            -- 医生行动计划【原话照录】，界面不生成；无则 NULL
  dash_keys     TEXT,            -- JSON 数组：看板快捷卡顺序
  created_on    TEXT,
  is_demo       INTEGER DEFAULT 0
);

/* 分节标题：key 与读模型 section 键一一对应；某档案没有这一节就不写行 */
CREATE TABLE section_titles (
  profile_key TEXT,
  key         TEXT,
  title       TEXT,
  ord         INTEGER,
  PRIMARY KEY (profile_key, key)
);

/* ---------- 指标（3） ---------- */

/* 指标目录：分类只作分组展示键，不进趋势
 * immun=免疫球蛋白 / subsets=淋巴细胞亚群 / hemogram=血象 */
CREATE TABLE metric_defs (
  key         TEXT PRIMARY KEY,  -- IGG / IGA / IGM / CD4 / CD19 / WBC
  title       TEXT,
  category    TEXT,
  unit        TEXT,              -- g/L / cells/µL / ×10⁹/L
  color       TEXT,
  ord         INTEGER
);

/* 化验结果：可比组 = method + org；不做跨组合并；IgG 谷浓度只存原始值，不做高低判定；
 * 参考范围不入库（参考范围是医生判读的输入，不是患者事实） */
CREATE TABLE lab_results (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  metric_key    TEXT NOT NULL REFERENCES metric_defs(key),
  measured_on   TEXT,            -- 未知则 NULL
  value         REAL,
  value_text    TEXT,            -- 文本型结果（如「结果未取」），与 value 二选一
  unit          TEXT,
  method        TEXT,            -- 免疫比浊 / 散射比浊 / 流式细胞术 / 血球仪 …
  org           TEXT,            -- 机构或「自录」
  report_id     TEXT,            -- 同一报告的多次修订同 ID（最近报告表口径）
  is_private    INTEGER DEFAULT 0,
  note          TEXT,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER
);

/* 指标分组标题（指标页与一图秀共用同一目录，组名/顺序/项数一致） */
CREATE TABLE metric_group_titles (
  profile_key TEXT,
  category    TEXT,
  title       TEXT,
  ord         INTEGER,
  PRIMARY KEY (profile_key, category)
);

/* ---------- 通用（7） ---------- */

/* 报告登记（原件状态：原件已登记/未取得原件/仅题录） */
CREATE TABLE reports (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  report_key    TEXT,            -- 同一报告历次修订同 key
  title         TEXT NOT NULL,
  kind          TEXT,            -- 化验 / 病历 / 影像 / 基因检测 / 其他
  reported_on   TEXT,
  source_state  TEXT,            -- 原件已登记 / 未取得原件 / 仅题录
  key_finding   TEXT,            -- 关键描述【照录】，不做判读
  is_private    INTEGER DEFAULT 0,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER,
  created_on    TEXT
);

/* 就医信息：多家医院逐条卡 */
CREATE TABLE hospitals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  name          TEXT NOT NULL,
  dept          TEXT,            -- 免疫科 / 呼吸科（会诊）…
  contact       TEXT,            -- 电话或「出处引用」
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER,
  created_on    TEXT
);

/* 复诊问题清单（由私密记录改写的问题继承私密：source_private_note_id） */
CREATE TABLE visit_questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  question      TEXT NOT NULL,
  added_on      TEXT,
  answered_on   TEXT,            -- NULL=待问
  is_private    INTEGER DEFAULT 0,
  source_private_note_id INTEGER,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER
);

/* 感受与照护：感受 / 家人支持事项（author=本人/家长代记；只记录不评估，无评分列） */
CREATE TABLE mind_notes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  kind          TEXT NOT NULL,   -- feel / family
  noted_on      TEXT,
  body          TEXT NOT NULL,
  author        TEXT,
  is_private    INTEGER DEFAULT 0,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER
);

/* 看法（患者/家属视角记录，恒不为结论） */
CREATE TABLE viewpoints (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  scope         TEXT,            -- 关联的 section 键
  body          TEXT NOT NULL,
  author        TEXT,
  is_private    INTEGER DEFAULT 0,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER
);

/* 文档（资料库登记） */
CREATE TABLE documents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  name          TEXT NOT NULL,
  doc_type      TEXT,            -- 病历 / 化验 / 基因检测 / 影像
  doc_date      TEXT,
  state         TEXT,            -- 已登记 / 已核对 / 待核对
  file_path     TEXT,
  is_private    INTEGER DEFAULT 0,
  created_on    TEXT
);

/* 预防性用药（医生方案原话照录；无剂量推荐列，剂量写进 schedule_text 原文） */
CREATE TABLE meds (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  name          TEXT NOT NULL,   -- 抗菌 / 抗病毒 / 抗真菌预防（照处方名）
  schedule_text TEXT,            -- 医生方案原话
  since_on      TEXT,
  note          TEXT,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER
);

/* ---------- 病种专属（4） ---------- */

/* 感染事件（第一实体）：end_date IS NULL = 感染中；
 * site/pathogen/anti_infective 均照录，未检出/未检写 NULL 或原文，不做病原判定 */
CREATE TABLE infection_events (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key      TEXT NOT NULL,
  start_date       TEXT NOT NULL,
  end_date         TEXT,         -- NULL = 感染中（缓解日期未知也 NULL + note 说明）
  site_text        TEXT,         -- 部位（肺/中耳/鼻窦/皮肤…）【患者自述照录】
  pathogen_text    TEXT,         -- 病原（若已检出）；未检或阴性照录原文，不做判定
  anti_infective_text TEXT,      -- 抗感染用药【处方/医嘱照录】
  note             TEXT,         -- 经过【照录】，界面不生成
  is_private       INTEGER DEFAULT 0,
  author_role      TEXT,         -- R3 双视角：本人 / 家长代记
  ver              INTEGER DEFAULT 1,
  superseded_by    INTEGER,
  created_on       TEXT
);

/* 免疫球蛋白替代治疗按次登记：agent_form = IVIG / SCIG / 复诊 / 其他；
 * dose_text=剂量【医嘱照录】（如「0.4g/kg 照医嘱」）；org=输注机构；reaction_text=输注反应【自述或照录】；
 * 不做疗效判定、不设排程列（「下次输注」只能按个人历史推算展示，不入库） */
CREATE TABLE infusion_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  event_date    TEXT NOT NULL,
  agent_form    TEXT NOT NULL,   -- IVIG / SCIG / 复诊 / 其他
  dose_text     TEXT,            -- 剂量原话照录，不做数值标准化判定
  org           TEXT,
  reaction_text TEXT,            -- 输注反应/备注【照录或事实描述】
  name          TEXT,            -- 制剂/内容照录
  note          TEXT,
  is_private    INTEGER DEFAULT 0,
  author_role   TEXT,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER,
  infection_id  INTEGER REFERENCES infection_events(id)
);

/* 接种与疫苗口径：医生已确认原话【一字不改照录】；界面不生成、不改写；无医生原话即无行 */
CREATE TABLE vaccine_consents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  consent_date  TEXT,            -- 什么时候说的；未知 NULL
  who_text      TEXT,            -- 谁说的（医生/机构）
  words_text    TEXT NOT NULL,   -- 原话照录，不补写不推测
  is_private    INTEGER DEFAULT 0,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER,
  created_on    TEXT
);

/* 诊断依据与档案字段（key-value，原文照录；不含分型判定）
 * fact_key 约定：诊断依据（医生原话）/ 基因检测 / 医生行动计划原话 / 建档日期 / 就诊医院 */
CREATE TABLE profile_facts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  fact_key      TEXT NOT NULL,
  fact_value    TEXT NOT NULL,
  fact_date     TEXT,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER,
  UNIQUE (profile_key, fact_key, ver)
);

/* ---------- 导入（3） ---------- */

CREATE TABLE import_batches (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  imported_on   TEXT,
  source_desc   TEXT,
  status        TEXT             -- pending / partial / done / failed
);

CREATE TABLE import_candidates (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id      INTEGER NOT NULL REFERENCES import_batches(id),
  target_table  TEXT NOT NULL,   -- lab_results / reports / infection_events …
  payload       TEXT NOT NULL,   -- JSON
  in_use        INTEGER DEFAULT 0,  -- 核对采用才置 1；未采用候选不进事实层
  is_private    INTEGER DEFAULT 0,
  review_note   TEXT
);

CREATE TABLE import_conflicts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id      INTEGER NOT NULL REFERENCES import_batches(id),
  candidate_id  INTEGER REFERENCES import_candidates(id),
  conflict_kind TEXT,            -- duplicate / unit_mismatch / method_mismatch
  detail        TEXT,
  resolved_on   TEXT
);

/* 读序索引（ORDER BY rowid 契约的补充索引，不改变语义） */
CREATE INDEX idx_lab_profile_metric ON lab_results(profile_key, metric_key, measured_on);
CREATE INDEX idx_infection_profile ON infection_events(profile_key, start_date);
CREATE INDEX idx_infusion_profile ON infusion_events(profile_key, event_date);
CREATE INDEX idx_reports_profile ON reports(profile_key, reported_on);
