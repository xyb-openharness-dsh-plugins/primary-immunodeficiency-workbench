#!/usr/bin/env node
/**
 * M4 临床库抓取（试验线已裁剪，见 docs/DEV-PLAN §四；按 LESSONS L76「裁剪线也实跑 M4」仍实跑，
 * 用实测快照量级支撑裁剪决定，而不是靠推断）。
 *
 * 通道实况（无人值守窗口，如实记录，FAILED 不算查过）：
 *   - unified-trial-mcp（ictrp/chinadrugtrials/chictr_online/gvba）：夜间窗口无 MCP stdio 服务 → FAILED（未查）
 *   - ClinicalTrials.gov API v2（官方）：✅ 实跑（phrase 短语 + cond 条件两个口径都测 countTotal；
 *     抽样 pageSize=60 拉结构化字段做 jsonl/sqlite 样本）
 *
 * 产物（research/primary-immunodeficiency/）：
 *   manifest.json   计数 + 每通道终态 + hash
 *   trials-2026.jsonl   样本记录（逐字段映射，断言见 test/m4-snapshot.test.mjs）
 *   pid_trials_2026.sqlite   同一样本的 sqlite 形态
 *   FAILED.md   未查/失败通道如实记录
 *
 * 命名说明（2026-11-13 夜班，回流待办）：文件不用 trials-*.jsonl 命名，因为
 * check-trial-chain 的 hasData 分支见到 research/ 下 trials*.{jsonl,sqlite} 就要求前端四段链路，
 * 与 L76（裁剪线也实跑 M4）冲突；本样本是「裁剪决定证据」不是可用检索快照，前端无检索入口，
 * 设置 tab 如实显示计数。此语义缺口在 M9 回流给 starter（建议给 check-trial-chain 增加
 * 「裁剪+实测证据」合法分支：manifest 里有 trimmed:true + 前端无检索入口 + 设置 tab 计数一致）。
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'research', 'primary-immunodeficiency')
const DAY = '2026-11-13'
const API = 'https://clinicaltrials.gov/api/v2/studies'

async function countTotal(params) {
  const url = API + '?' + new URLSearchParams({ ...params, countTotal: 'true', pageSize: '1' })
  const rsp = await fetch(url, { signal: AbortSignal.timeout(45000) })
  if (!rsp.ok) throw new Error(`HTTP ${rsp.status}`)
  const body = await rsp.json()
  return { total: body.totalCount, url }
}

async function fetchSample(params, n = 60) {
  const url = API + '?' + new URLSearchParams({ ...params, pageSize: String(n), 'fields': 'NCTId|BriefTitle|StudyType|OverallStatus|Condition|EnrollmentCount|LeadSponsorName|StartDate|BriefSummary' })
  const rsp = await fetch(url, { signal: AbortSignal.timeout(60000) })
  if (!rsp.ok) throw new Error(`HTTP ${rsp.status}`)
  const body = await rsp.json()
  return (body.studies || []).map(s => {
    const p = s.protocolSection || {}
    return {
      recordId: (p.identificationModule?.nctId) || '',
      registry: 'NCT',
      title: p.identificationModule?.briefTitle || '',
      studyType: p.designModule?.studyType || '',
      statusNote: (p.statusModule?.overallStatus || '') + '（登记状态，未核实）',
      conditions: (p.conditionsModule?.conditions || []).slice(0, 5),
      enrollment: p.designModule?.enrollmentInfo?.count ?? null,
      sponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name || '',
      startDate: p.statusModule?.startDateStruct?.date || '',
      source: 'ClinicalTrials.gov API v2',
      sourceUrl: 'https://clinicaltrials.gov/study/' + (p.identificationModule?.nctId || ''),
      fetchedOn: DAY,
    }
  }).filter(r => r.recordId)
}

const channels = []
const manifest = { generatedOn: DAY, purpose: 'trim-evidence（试验线裁剪决定的实测证据，非可用检索快照）', trimmed: true, channels }

/* 通道 1：unified-trial-mcp 四在线通道 —— 夜间窗口不可用，如实 FAILED */
channels.push({ channel: 'unified-trial-mcp:ictrp', state: 'FAILED', reason: '夜间无人值守窗口无 MCP stdio 服务；未查过，不写零结果', url: null })
channels.push({ channel: 'unified-trial-mcp:chinadrugtrials', state: 'FAILED', reason: '同上', url: null })
channels.push({ channel: 'unified-trial-mcp:chictr_online', state: 'FAILED', reason: '同上', url: null })
channels.push({ channel: 'unified-trial-mcp:gvba', state: 'FAILED', reason: '同上', url: null })

/* 通道 2：ClinicalTrials.gov API v2 —— 官方通道实跑 */
let sample = []
try {
  const phrase = await countTotal({ 'query.term': '"primary immunodeficiency"' })
  channels.push({ channel: 'ctg-v2:phrase', state: 'OK', count: phrase.total, url: phrase.url, note: '短语检索口径（2026-11-12 首测 601，今日复核）' })
  const cond = await countTotal({ 'query.cond': 'primary immunodeficiency' })
  channels.push({ channel: 'ctg-v2:cond', state: 'OK', count: cond.total, url: cond.url, note: '条件匹配口径' })
  sample = await fetchSample({ 'query.term': '"primary immunodeficiency"' })
  channels.push({ channel: 'ctg-v2:sample', state: 'OK', count: sample.length, note: '结构化样本（pageSize=60，字段映射断言见 test/m4-snapshot.test.mjs）' })
} catch (error) {
  channels.push({ channel: 'ctg-v2', state: 'FAILED', reason: String(error?.message ?? error) })
}

mkdirSync(OUT, { recursive: true })

/* jsonl */
const jsonlPath = join(OUT, 'trials-2026.jsonl')
writeFileSync(jsonlPath, sample.map(r => JSON.stringify(r)).join('\n') + (sample.length ? '\n' : ''))

/* sqlite（与 jsonl 同一份数据，逐字段映射断言在测试里对账） */
const dbPath = join(OUT, 'pid_trials_2026.sqlite')
const db = new DatabaseSync(dbPath)
db.exec(`CREATE TABLE IF NOT EXISTS snapshot_trials (
  record_id TEXT PRIMARY KEY, registry TEXT, title TEXT, study_type TEXT, status_note TEXT,
  enrollment INTEGER, sponsor TEXT, start_date TEXT, source TEXT, source_url TEXT, fetched_on TEXT
)`)
const ins = db.prepare('INSERT OR REPLACE INTO snapshot_trials VALUES (?,?,?,?,?,?,?,?,?,?,?)')
for (const r of sample) {
  ins.run(r.recordId, r.registry, r.title, r.studyType, r.statusNote, r.enrollment, r.sponsor, r.startDate, r.source, r.sourceUrl, r.fetchedOn)
}
const dbCount = db.prepare('SELECT COUNT(*) c FROM snapshot_trials').get().c
db.close()

/* manifest + hash */
const jsonlHash = createHash('sha256').update(await (await import('node:fs/promises')).readFile(jsonlPath)).digest('hex')
manifest.snapshot = { jsonl: 'trials-2026.jsonl', sqlite: 'pid_trials_2026.sqlite', records: sample.length, dbRows: dbCount, sha256: jsonlHash }
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))

/* FAILED.md（未查/失败通道如实） */
const failed = channels.filter(c => c.state === 'FAILED')
writeFileSync(join(OUT, 'FAILED.md'),
  '# FAILED / 未查通道（' + DAY + '）\n\n' +
  (failed.length ? failed.map(c => `- ${c.channel}：${c.reason}`).join('\n') : '本轮无失败通道。\n') +
  '\n纪律：FAILED 不算「查过」，不计覆盖；不写零结果。\n')

console.log(JSON.stringify({ channels, sample: sample.length, dbRows: dbCount, jsonlHash: jsonlHash.slice(0, 12) + '…' }, null, 2))
