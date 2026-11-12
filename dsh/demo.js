/**
 * 合成演示档案（is_demo=1）。M0 骨架只播种档案层；业务演示数据（感染/置换/化验）
 * 随 M2 的 DEMO_DATA 唯一源一起定稿并标注「合成示例」。
 *
 * 为什么 is_demo 必须是列：用户新建的档案（is_demo=0）与演示档案必须能并存、能区分、
 * 能一键清掉演示而绝不碰真实数据（Workbench.removeDemo 只删 is_demo=0 之外……准确说只删 is_demo=1）。
 */
const DEMO_PROFILES = [
  {
    profile_key: 'demo-a-jiaoyu',
    name: '示例档案 A · 刚确诊',
    meta: JSON.stringify({ perspective: '家长代记', note: '合成示例，未连接真实病历' }),
    headline: '确诊评估期：检查还在排队（合成示例）',
    dash_keys: JSON.stringify(['igg', 'infection_count']),
    created_on: '2026-11-01',
  },
  {
    profile_key: 'demo-b-suisheng',
    name: '示例档案 B · 维持期多年',
    meta: JSON.stringify({ perspective: '本人', note: '合成示例，未连接真实病历' }),
    headline: 'IVIG 维持期：按 4 周节律置换中（合成示例）',
    dash_keys: JSON.stringify(['igg', 'infusion_gap', 'infection_count']),
    created_on: '2026-11-01',
  },
]

export function seedDemoData(db) {
  const count = db.prepare('SELECT COUNT(*) c FROM subjects').get().c
  if (count > 0) return { skipped: true, profiles: count }
  const ins = db.prepare('INSERT INTO subjects (profile_key, name, meta, headline, dash_keys, created_on, is_demo) VALUES (?,?,?,?,?,?,1)')
  for (const p of DEMO_PROFILES) ins.run(p.profile_key, p.name, p.meta, p.headline, p.dash_keys, p.created_on)
  return { skipped: false, profiles: DEMO_PROFILES.length }
}

export function hasDemoData(db) {
  return db.prepare('SELECT COUNT(*) c FROM subjects WHERE is_demo = 1').get().c > 0
}
