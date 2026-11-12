/**
 * bootstrap parity：内存库播种后 readBootstrap 输出与 prototypes/v0.2/demo-data.js 的
 * DEMO_DATA 关键字段对账（读模型是「还原 demo 形状」的唯一验收标准）。
 *
 * 断言口径（M5 指定）：
 *   - 两档案名 / tag；
 *   - B 档案感染 8 条，其中私密 1 条；
 *   - B 档案 IGG 最近值（按日期）8.6；A 档案 IGG 2.1；
 *   - 疫苗口径 B 1 条 / A 0 条；
 *   - 报告数 A 2 / B 5；
 *   - 全表私密计数逐表与 demo-data 一致。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openStore, migrate } from '../dsh/store.js'
import { seedDemoData } from '../dsh/demo.js'
import { readBootstrap, bootstrapForExit } from '../dsh/readmodels.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

const D = new Function('window',
  readFileSync(join(root, 'prototypes/v0.2/demo-data.js'), 'utf8') + '; return window.DEMO_DATA;')({})

const db = openStore(':memory:')
migrate(db)
const seed = seedDemoData(db)
const data = readBootstrap(db)

test('播种非空且读模型返回 TODAY + 两档案，名字与 tag 逐一一致', () => {
  assert.equal(seed.skipped, false)
  assert.equal(data.profiles.length, 2)
  const [a, b] = data.profiles
  assert.equal(a.id, 'demo-a')
  assert.equal(b.id, 'demo-b')
  assert.equal(a.name, D.profiles[0].name)
  assert.equal(b.name, D.profiles[1].name)
  assert.equal(a.tag, D.profiles[0].tag)
  assert.equal(b.tag, D.profiles[1].tag)
  assert.ok(data.TODAY, 'TODAY 必须存在（读时算，不写死）')
})

test('B 档案感染 8 条、其中私密 1 条；A 档案感染 3 条、私密 1 条', () => {
  const [a, b] = data.profiles
  assert.equal(b.infections.length, 8)
  assert.equal(b.infections.filter((x) => x.private).length, 1)
  assert.equal(a.infections.length, 3)
  assert.equal(a.infections.filter((x) => x.private).length, 1)
  /* 语义映射抽查：site/pathogen/meds(anti_infective_text) 照录 */
  const pneumonia = b.infections.find((x) => x.start === '2024-03-05')
  assert.equal(pneumonia.site, '肺')
  assert.equal(pneumonia.pathogen, '肺炎链球菌（痰培养）')
  assert.equal(pneumonia.meds, '青霉素（皮试阳性，换用替代方案——医嘱原话待补）')
})

test('IGG 最近值：B 8.6（2026-11-06 谷浓度），A 2.1', () => {
  const [a, b] = data.profiles
  const lastIg = (p) => p.labs.filter((l) => l.metric === 'IGG')
    .sort((x, y) => (x.date < y.date ? -1 : 1)).pop()
  assert.equal(lastIg(b).value, 8.6)
  assert.equal(lastIg(b).date, '2026-11-06')
  assert.equal(lastIg(a).value, 2.1)
  assert.equal(lastIg(a).metric, 'IGG')
})

test('疫苗口径：B 1 条 / A 0 条；words 原话照录', () => {
  const [a, b] = data.profiles
  assert.equal(b.vaccines.length, 1)
  assert.equal(a.vaccines.length, 0)
  assert.equal(b.vaccines[0].who, D.profiles[1].vaccines[0].who)
  assert.equal(b.vaccines[0].words, D.profiles[1].vaccines[0].words)
})

test('报告数：A 2 / B 5；report id 用 report_key 原样还原', () => {
  const [a, b] = data.profiles
  assert.equal(a.reports.length, 2)
  assert.equal(b.reports.length, 5)
  assert.equal(b.reports[0].id, 'b-rep-1')
  assert.equal(b.reports[3].private, true, 'B 的第 4 份报告（胸部 CT）是私密')
})

test('替代治疗登记：kind 映射回演示口径（IVIG 输注 / 复诊），B 5 条 A 0 条', () => {
  const [a, b] = data.profiles
  assert.equal(a.infusions.length, 0)
  assert.equal(b.infusions.length, 5)
  assert.deepEqual(
    [...new Set(b.infusions.map((t) => t.kind))].sort(),
    ['IVIG 输注', '复诊'],
  )
  assert.equal(b.infusions[0].date, '2026-08-14')
})

test('全表私密计数逐表与 demo-data 一致（A/B 两档案合计）', () => {
  const demoPrivate = (pick) => D.profiles.reduce((n, p) => n + pick(p).filter((x) => x.private).length, 0)
  const cases = [
    ['infections', (p) => p.infections],
    ['infusions', (p) => p.infusions],
    ['labs', (p) => p.labs],
    ['vaccines', (p) => p.vaccines],
    ['reports', (p) => p.reports],
    ['questions', (p) => p.questions],
    ['mind.feel', (p) => p.mind.feel],
    ['mind.family', (p) => p.mind.family],
  ]
  for (const [name, pick] of cases) {
    const want = demoPrivate(pick)
    const got = data.profiles.reduce((n, p) => n + pick(p).filter((x) => x.private).length, 0)
    assert.equal(got, want, `${name} 私密计数不一致`)
  }
})

test('导出 / AI 出口剥离私密行（三出口过滤之二在服务层强制生效）', () => {
  for (const exit of ['export', 'ai']) {
    const stripped = bootstrapForExit(db, exit)
    for (const p of stripped.profiles) {
      for (const key of ['infections', 'infusions', 'labs', 'vaccines', 'reports', 'questions']) {
        assert.ok(p[key].every((x) => !x.private), `${exit} 出口 ${key} 不应含私密行`)
      }
      assert.ok(p.mind.feel.every((x) => !x.private))
      assert.ok(p.mind.family.every((x) => !x.private))
    }
  }
  /* 看板出口保留私密标记（页面要显示「私密」徽标） */
  const full = bootstrapForExit(db, 'dashboard')
  assert.equal(full.profiles[1].infections.filter((x) => x.private).length, 1)
})

test('新建真实档案与演示档案并存（is_demo=0），bootstrap 一并返回', () => {
  db.prepare("INSERT INTO subjects (profile_key, name, meta, headline, action_plan, dash_keys, created_on, is_demo) VALUES ('local-x1', '测试档案', '我自己记录', NULL, NULL, NULL, '2026-11-13', 0)").run()
  const again = readBootstrap(db)
  assert.equal(again.profiles.length, 3)
  assert.equal(again.profiles[2].isDemo, false)
  assert.equal(again.profiles[2].infections.length, 0)
  db.prepare("DELETE FROM subjects WHERE profile_key = 'local-x1'").run()
})
