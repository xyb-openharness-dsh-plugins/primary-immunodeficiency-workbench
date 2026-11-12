# freeze-contract · primary-immunodeficiency-workbench

- 冻结文件：schema/0001_initial.sql
- sha256：`b87bccabe2d4d9f42629ba8b5883c8301345c28438bbe0c5642d59159003d977`
- 冻结时间：2026-11-13（M3 · 夜间无人值守）
- 纪律：G3 后结构变更只能新增 000N_*.sql；改冻结文件会被 check 拦下。判读列断言（check-schema-words）已入 check 链。
- 表清单（19）：档案级 2（subjects / section_titles）· 指标 3（metric_defs / lab_results / metric_group_titles）· 通用 7（reports / hospitals / visit_questions / mind_notes / viewpoints / documents / meds）· 病种专属 4（infection_events / infusion_events / vaccine_consents / profile_facts）· 导入 3（import_batches / import_candidates / import_conflicts）
- 字段语境（私密策略/来源/未知值/排序/禁止持久化）：
  - 私密：is_private 全表统一；三出口（看板摘要/导出/AI 上下文）读模型共用 sharedOnly；
  - 未知值：日期类 NULL（不用空串）；病原未检/阴性照录原文进 pathogen_text，不做判定；
  - 排序：全部列表读时 ORDER BY rowid 或日期列，读模型内注明；
  - 禁止持久化的派生判断：距上次感染天数 / 近 12 月感染次数 / 下次替代治疗参考间隔 / IgG 谷浓度高低——一律读时算，无列；
  - 参考范围不入库（lab_results 无 reference 列）。
- 迁移账本：schema_migrations（migration, sha256, applied_at），重复执行幂等（dsh/store.js）。
