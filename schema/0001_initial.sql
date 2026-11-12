-- 小御宝 ImmuPal · 档案层（M0 骨架版）
-- 业务表（感染/置换/化验/用药/接种/复诊）随 M3 冻结合同一起定稿；
-- 本迁移只落「档案」这一层：多档案共存、demo 与真实分离。
-- 硬约束：显式 null 不用空串冒充；无判读列（diagnosis/risk_level 类一律不入库）。

CREATE TABLE IF NOT EXISTS subjects (
  profile_key  TEXT PRIMARY KEY,            -- 档案唯一键（UUID）
  name         TEXT NOT NULL,               -- 档案名（谁的一本账）
  meta         TEXT NOT NULL DEFAULT '{}',  -- JSON 事实性描述：视角（本人/家长代记）、出生年份等
  headline     TEXT NOT NULL DEFAULT '',    -- 看板状态句：医生原话或事实句，不做判定
  dash_keys    TEXT NOT NULL DEFAULT '[]',  -- JSON：看板想盯的指标键
  created_on   TEXT NOT NULL,               -- 建档日期 YYYY-MM-DD
  is_demo      INTEGER NOT NULL DEFAULT 0   -- 1=合成演示档案；用户新建的档案恒为 0
);

CREATE INDEX IF NOT EXISTS idx_subjects_created ON subjects (created_on);
