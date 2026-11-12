/**
 * 包的入口：DSH 插件的服务端侧（家族 cidp 接线形状，字符串换 PID）。
 *
 * 宿主（Harness）加载的就是这个文件，需要 `name` / `inject` / `Config` / `apply` 四样：
 * - `name` / `inject` / `apply` 的实质逻辑在 `dsh/workbench.js` 与 `dsh/server.js`（零宿主依赖、可单测）；
 * - `Config` 必须在**本文件**末尾——官方要求它是 Schemastery schema，而 Schemastery 是宿主提供的
 *   peer 依赖，本仓库里装不上。为了不让 `apply()` 跟着不可测，只把这一行留在入口。
 *
 * 独立启动：`npm start -- --root <资料目录>`（scripts/dev-server.mjs，同一份 handler）。
 */
import Schema from '@deepseek-ai/schemastery'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Workbench } from './workbench.js'
import { createHandler } from './server.js'
import { PLUGIN_ID, API_PREFIX } from '../lib/identity.js'
import { version, displayVersion, build as buildDate } from '../lib/version.js'

export { Workbench } from './workbench.js'
export { createHandler, resolveStatic, checkDataDir, injectTokens } from './server.js'
export { readBootstrap, readSubject, bootstrapForExit } from './readmodels.js'
export { openStore, closeStore, migrate } from './store.js'
export { seedDemoData } from './demo.js'
export { resolveToken, parseLocalText, importFiles } from './mineru.js'
export { PLUGIN_ID, API_PREFIX, HOME_DIR, DB_FILE, UI_ENTRY, DEV_PORT } from '../lib/identity.js'
export { PANEL, AGENT_PANE, assertPanelConfig } from '../lib/layout.js'
export { guardStartupApiBase, validateApiBase, buildApiUrl, detectForm } from '../lib/api-base.js'

export const name = PLUGIN_ID
export const inject = ['webServer', 'connection']

const HERE = dirname(fileURLToPath(import.meta.url))
export const PUBLIC_DIR = join(HERE, '..', 'public')

/**
 * 宿主挂载形态的 API_BASE。
 * 宿主把插件挂在 `/api/<slug>` 下，因此页面拼 `${API_BASE}/api/bootstrap`
 * = `/api/primary-immunodeficiency/api/bootstrap`（**交界处只有一个 /api 对**，不是重复）。
 */
export const API_BASE_HOSTED = `/api/${API_PREFIX}`

/** 建一个带认证检查的 handler（宿主与独立启动共用同一份）。 */
export function createHostHandler(ctx, workbench, { dataRootOverride } = {}) {
  const services = {
    version, displayVersion, buildDate,
    capabilities: ['bootstrap', 'health', 'data-root', 'subjects'],
    bootstrap: () => workbench.bootstrap(),
    /* 资料目录：面板点「配置目录」走这两个，服务端再判一遍口径 */
    dataRoot: () => workbench.dataRoot,
    setDataRoot: (dir) => {
      const next = workbench.setDataRoot(dir)
      if (dataRootOverride) dataRootOverride(dir)
      return next
    },
    createSubject: (input) => workbench.createSubject(input),
    deleteSubject: (key) => workbench.deleteSubject(key),
  }
  const inner = createHandler({ apiBase: API_BASE_HOSTED, publicDir: PUBLIC_DIR, services })
  return (req, res) => {
    /* 宿主形态：认证由 connection 能力提供；独立启动没有 ctx，直接走 inner */
    if (ctx) {
      const send = (status, body) => {
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify(body))
      }
      if (typeof ctx.connection?.requestRejection !== 'function') return send(503, { error: 'connection authentication capability unavailable' })
      const rejection = ctx.connection.requestRejection(req)
      if (rejection !== undefined) return send(rejection, { error: 'Authentication required' })
    }
    return inner(req, res)
  }
}

/**
 * config 是**第二个参数**，不是 `ctx.config`。
 *
 * 家族实测（2026-10-25）：写成 `ctx.config?.root` 时宿主直接报
 *   `cannot get property "config" without inject`
 * —— Cordis 的服务访问守卫要求把 'config' 声明进 inject，而 config 本来就不走服务通道。
 */
export function apply(ctx, config = {}) {
  if (!ctx.webServer?.register) throw new Error('Desktop webServer.register is unavailable')
  const root = config?.root
  if (typeof root !== 'string' || root.trim() === '') {
    /* 不裸 throw 白屏：登记一个返回可读错误的健康接口，让前端能显示原因 */
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact', path: `${API_BASE_HOSTED}/health`,
      handler(req, res) {
        res.writeHead(503, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify({ error: 'root 未配置', detail: 'cordis.patch.yml 需要 config.root: !!js dshHomePath(...)' }))
      },
    }), 'primary-immunodeficiency health (unconfigured)')
    return
  }

  /* 资料根目录的覆盖值持久化在 root/data-root.json（schema 冻结、无 app_setting 表，
     家族用 app_setting 的那一步在这里落成文件；GET/POST /root 走 Workbench.setDataRoot）。 */
  const overrideFile = () => join(root, 'data-root.json')
  const readOverride = () => {
    try {
      if (!existsSync(overrideFile())) return ''
      const parsed = JSON.parse(readFileSync(overrideFile(), 'utf8'))
      return typeof parsed?.dataRoot === 'string' ? parsed.dataRoot : ''
    } catch { return '' }
  }

  let workbench = null
  try {
    workbench = new Workbench({ root: readOverride() || root })
    workbench.open()
  } catch (error) {
    ctx.log?.warn?.(`[primary-immunodeficiency] 档案库打开失败：${error?.message ?? error}`)
  }
  ctx.effect(() => { try { workbench?.close() } catch { /* 幂等关库 */ } }, 'primary-immunodeficiency store close')

  const persistOverride = (dir) => {
    try {
      writeFileSync(overrideFile(), JSON.stringify({ dataRoot: dir, savedOn: new Date().toISOString().slice(0, 10) }, null, 2))
    } catch (error) {
      ctx.log?.warn?.(`[primary-immunodeficiency] 资料目录覆盖值写入失败：${error?.message ?? error}`)
    }
  }

  const handler = createHostHandler(ctx, workbench, { dataRootOverride: persistOverride })
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: API_BASE_HOSTED, handler }), 'primary-immunodeficiency routes')
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: '/' + API_PREFIX, handler }), 'primary-immunodeficiency ui')
}

/** UI 入口文件是否存在（装机自检用） */
export function uiReady() {
  return existsSync(join(PUBLIC_DIR, 'index.html'))
}

export const Config = Schema.object({
  root: Schema.string().required(),
})
