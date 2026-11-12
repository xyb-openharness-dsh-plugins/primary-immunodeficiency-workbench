import Schema from '@deepseek-ai/schemastery'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { Workbench } from './workbench.js'

export const name = 'primary-immunodeficiency-main'
export const inject = ['webServer', 'connection']
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

const API_BASE = '/api/primary-immunodeficiency'

/* 资料目录口径（与客户端 isForbiddenDir 同一条规则；服务端再判一遍）：
   主目录本身 / 桌面 / 下载根目录 / tmp 一律不当资料目录。源码目录也不是资料目录。 */
const HOME_EXACT = /^(\/Users\/[^/]+|\/home\/[^/]+|\/root|[A-Za-z]:\\Users\\[^\\]+)$/i
const FORBIDDEN_DIR = /((Desktop|桌面)$|(Downloads?|下载(夹)?)$|^(\/tmp|\/private\/tmp|\/var\/folders\/|\/private\/var\/folders\/))/i
const isForbiddenDir = (dir) => HOME_EXACT.test(dir) || FORBIDDEN_DIR.test(dir)

/* 家族实测（2026-10-25）：写成 `ctx.config?.root` 时宿主直接报
   config 未接线的错；root 必须从 apply(ctx, config) 第二参读。 */
export function apply(ctx, config) {
  if (!ctx.webServer?.register) throw new Error('Desktop webServer.register is unavailable')
  const root = config?.root
  if (typeof root !== 'string' || root.trim() === '') {
    // 宿主仍会注册，但业务接口直接报配置缺口，避免"装上了但数据没地方落"的假可用。
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact', path: API_BASE + '/health',
      handler(req, res) {
        res.writeHead(503, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify({ error: 'root 未配置', detail: 'cordis.patch.yml 需要 config.root: !!js dshHomePath(...)' }))
      },
    }), 'primary-immunodeficiency health')
    return
  }

  /* 资料根目录的覆盖值持久化在 root/data-root.json；GET 返回生效目录。 */
  const overrideFile = () => join(root, 'data-root.json')
  const readOverride = () => {
    try {
      if (!existsSync(overrideFile())) return ''
      const parsed = JSON.parse(readFileSync(overrideFile(), 'utf8'))
      return typeof parsed?.dataRoot === 'string' ? parsed.dataRoot : ''
    } catch { return '' }
  }
  const currentRoot = () => readOverride() || root

  const send = (res, status, body) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    res.end(JSON.stringify(body))
  }
  const authed = (req) => {
    if (typeof ctx.connection?.requestRejection !== 'function') return null
    const rejection = ctx.connection.requestRejection(req)
    return rejection === undefined ? null : { status: rejection, body: { error: 'Authentication required' } }
  }

  /* 档案层：一个资料根一个库；Workbench 负责迁移与播种。
     切换资料目录时先在新目录开库成功再替换，失败保留旧库（与 cidp 同一口径）。 */
  let workbench = null
  const openWorkbench = (dir) => {
    const next = new Workbench({ root: dir })
    next.open()
    return next
  }
  try {
    workbench = openWorkbench(currentRoot())
    workbench.version = manifest.version
  } catch (error) {
    ctx.log?.warn?.(`[primary-immunodeficiency] 档案库打开失败：${error?.message ?? error}`)
  }
  ctx.effect(() => { try { workbench?.close() } catch { /* 幂等关库 */ } }, 'primary-immunodeficiency close store')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: API_BASE + '/health',
    handler(req, res) {
      const gate = authed(req)
      if (gate) return send(res, gate.status, gate.body)
      if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' })
      send(res, 200, { ok: true, version: manifest.version, apiVersion: 'v1', capabilities: ['health', 'data-root', 'subjects', 'bootstrap'] })
    },
  }), 'primary-immunodeficiency health')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: API_BASE + '/subjects',
    handler(req, res) {
      const gate = authed(req)
      if (gate) return send(res, gate.status, gate.body)
      if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
      const chunks = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', () => {
        let body = {}
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { body = {} }
        try {
          const profile = workbench.createSubject(body)
          send(res, 200, profile)
        } catch (error) {
          send(res, 400, { error: error?.message ?? String(error) })
        }
      })
    },
  }), 'primary-immunodeficiency subjects')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: API_BASE + '/bootstrap',
    handler(req, res) {
      const gate = authed(req)
      if (gate) return send(res, gate.status, gate.body)
      if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' })
      try { send(res, 200, workbench.bootstrap()) } catch (error) { send(res, 500, { error: error?.message ?? String(error) }) }
    },
  }), 'primary-immunodeficiency bootstrap')

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: API_BASE + '/root',
    handler(req, res) {
      const gate = authed(req)
      if (gate) return send(res, gate.status, gate.body)
      if (req.method === 'GET') return send(res, 200, { dir: currentRoot(), configured: Boolean(config?.root) })
      if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
      const chunks = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', () => {
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { body = {} }
        const dir = typeof body?.dir === 'string' ? body.dir.trim() : ''
        if (!dir) return send(res, 400, { error: '缺少 dir' })
        if (isForbiddenDir(dir)) {
          return send(res, 400, { error: '这个位置不能当资料目录（主目录本身 / 桌面 / 下载根目录 / tmp）。请在里面新建一个专用文件夹再选。' })
        }
        try {
          writeFileSync(overrideFile(), JSON.stringify({ dataRoot: dir, savedOn: new Date().toISOString().slice(0, 10) }, null, 2))
          try {
            const next = openWorkbench(dir)
            try { workbench?.close() } catch { /* 幂等关库 */ }
            workbench = next
          } catch (error) {
            send(res, 500, { error: `新目录开库失败：${error?.message ?? error}（目录覆盖值已保存）` })
            return
          }
          send(res, 200, { dir })
        } catch (error) {
          send(res, 500, { error: `目录写入失败：${error?.message ?? error}` })
        }
      })
    },
  }), 'primary-immunodeficiency data-root')
}

export const Config = Schema.object({
  root: Schema.string().required(),
})
