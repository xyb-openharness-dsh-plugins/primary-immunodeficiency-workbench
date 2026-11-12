/**
 * HTTP 层：API + 静态资源 + 路径穿越拦截（家族模板移植，字符串换 PID/小御宝）。
 *
 * 边界（DEV-REQUIREMENTS §三）：
 *   - API 前缀由调用方给（宿主里 `/api/primary-immunodeficiency`，独立启动空串）；
 *   - 静态资源只从 `public/` 出，**任何**路径穿越（`..`、绝对路径、符号链接逃逸）都拒绝；
 *   - 错误一律走 JSON（API）或纯文本（静态），**不留裸 throw 白屏**；
 *   - 本文件不碰 AI、不存会话：会话由宿主管理。
 */
import { readFileSync, existsSync, realpathSync, statSync } from 'node:fs';
import { extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

/** 静态根必须落在包内：解析后仍以 root 为前缀，否则拒绝。 */
export function resolveStatic(root, urlPath) {
  const clean = decodeURIComponent(String(urlPath).split('?')[0].split('#')[0]);
  if (clean.includes('\0')) return null;
  const rel = normalize(clean).replace(/^([/\\])+/, '');
  if (rel.split(/[/\\]/).includes('..')) return null;
  const abs = resolve(root, rel === '' ? 'index.html' : rel);
  const rootReal = realpathSync(root);
  let absReal;
  try { absReal = realpathSync(abs); } catch { return null; }
  const r = relative(rootReal, absReal);
  if (r === '' || r.startsWith('..' + sep) || r === '..' || r.startsWith(sep)) return null;
  try { if (!statSync(absReal).isFile()) return null; } catch { return null; }
  return absReal;
}

export function contentType(file) {
  return MIME[extname(file).toLowerCase()] || 'application/octet-stream';
}

/**
 * 服务时注入（而不是构建时写死）：**同一份 public/ 要在两种形态下都正确**。
 *   - `__API_BASE__`：独立启动 ''，宿主 '/api/primary-immunodeficiency'；
 *   - `__VERSION__` / `__VERSION_DISPLAY__`：来自 lib/version.js 唯一源。
 */
export function injectTokens(text, { apiBase = '', version = '', displayVersion = '', buildDate = '' } = {}) {
  return text
    .replace(/__API_BASE__/g, apiBase)
    .replace(/__VERSION_DISPLAY__/g, displayVersion)
    .replace(/__VERSION__/g, version)
    .replace(/__BUILD_DATE__/g, buildDate);
}

/**
 * 挂在宿主前缀下的静态资源必须**先剥前缀再解析**（家族 2026-10-25 装机前实测）：
 *   宿主把插件挂在 `/primary-immunodeficiency` 与 `/api/primary-immunodeficiency`，
 *   浏览器请求 `/primary-immunodeficiency/app.js`。不剥前缀 → 去 public/primary-immunodeficiency/
 *   找 → 找不到 → SPA 兜底递回 index.html → HTML 被当 JS 解析 → 业务区全白。
 *   dev-server 挂在根上，本地永远看不到这个故障。
 */
const UI_MOUNTS = ['/primary-immunodeficiency', '/api/primary-immunodeficiency'];

function stripMount(pathname) {
  for (const m of UI_MOUNTS) {
    if (pathname === m) return '/';
    if (pathname.startsWith(m + '/')) return pathname.slice(m.length);
  }
  return pathname;
}

/**
 * 资料目录口径（与面板同一条规则，服务端再判一遍）：
 * 主目录本身、桌面、下载根目录、tmp 一律拒绝。源码目录不是资料目录。
 * 拒绝要给出**人话理由**——静默接受比报错更危险（用户以为数据在那儿，其实不在）。
 */
export function checkDataDir(raw) {
  const dir = String(raw || '').trim();
  if (!dir) return { ok: false, reason: '目录为空' };
  if (!isAbsolute(dir)) return { ok: false, reason: '请选择绝对路径' };
  const homeExact = /^(\/Users\/[^/]+|\/home\/[^/]+|\/root|[A-Za-z]:\\Users\\[^\\]+)$/i;
  if (homeExact.test(dir)) return { ok: false, reason: '主目录本身不作为资料目录，请在下面建一个专用文件夹' };
  if (/(Desktop|桌面)$/i.test(dir)) return { ok: false, reason: '桌面不作为资料目录' };
  if (/(Downloads?|下载(夹)?)$/i.test(dir)) return { ok: false, reason: '下载根目录不作为资料目录' };
  if (/^(\/tmp|\/private\/tmp|\/var\/folders\/|\/private\/var\/folders\/)/i.test(dir)) return { ok: false, reason: 'tmp 不作为资料目录（会被系统清理）' };
  return { ok: true, dir };
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { if (raw.length < 64 * 1024) raw += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

export function createHandler({ apiBase = '', publicDir, services }) {
  const sendJson = (res, status, body) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(body));
  };

  return async function handle(req, res) {
    let pathname;
    try { pathname = new URL(req.url, 'http://localhost').pathname; } catch { return sendJson(res, 400, { error: 'Bad request' }); }

    /* ---------- API ---------- */
    const apiPrefix = apiBase === '' ? '/api' : apiBase + '/api';
    if (pathname === apiPrefix + '/bootstrap' || pathname === apiPrefix + '/health') {
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });
      try {
        if (pathname.endsWith('/health')) {
          return sendJson(res, 200, { ok: true, version: services.version, apiVersion: 'v1', capabilities: services.capabilities });
        }
        return sendJson(res, 200, services.bootstrap());
      } catch (error) {
        /* 不裸 throw：把原因交给前端渲染错误横幅（禁白屏） */
        return sendJson(res, 500, { error: 'bootstrap failed', detail: String(error.message || error) });
      }
    }

    /* ---------- 患者档案：新建 / 删除（真实用户数据，与 demo 并存） ---------- */
    if (pathname === apiPrefix + '/subjects' && services.createSubject) {
      try {
        if (req.method === 'POST') return sendJson(res, 200, services.createSubject(await readJson(req)));
        if (req.method === 'DELETE') {
          const key = new URL(req.url, 'http://localhost').searchParams.get('profileKey') || '';
          return sendJson(res, 200, services.deleteSubject(key));
        }
        return sendJson(res, 405, { error: 'Method not allowed' });
      } catch (error) {
        return sendJson(res, 400, { error: '新建档案失败', detail: String(error.message || error) });
      }
    }

    /* ---------- 资料目录：选择 / 读取（真入口，不是说明弹窗） ---------- */
    if (pathname === apiPrefix + '/root' && services.dataRoot !== undefined) {
      try {
        if (req.method === 'GET') return sendJson(res, 200, { dir: services.dataRoot() });
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
        const body = await readJson(req);
        const verdict = checkDataDir(body?.dir);
        if (!verdict.ok) return sendJson(res, 400, { error: verdict.reason, dir: services.dataRoot() });
        return sendJson(res, 200, { dir: services.setDataRoot(body.dir) });
      } catch (error) {
        return sendJson(res, 400, { error: 'root 切换失败', detail: String(error.message || error), dir: services.dataRoot?.() });
      }
    }

    if (pathname.startsWith(apiPrefix + '/')) return sendJson(res, 404, { error: 'Unknown API route' });

    /* ---------- 静态 ---------- */
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'Method not allowed' });
    if (!publicDir || !existsSync(publicDir)) { res.writeHead(500); return res.end('public dir missing'); }
    /* 宿主形态（apiBase 非空）才需要剥前缀；独立启动挂在根上，路径原样 */
    const staticPath = apiBase === '' ? pathname : stripMount(pathname);
    const file = resolveStatic(publicDir, staticPath === '/' ? '/index.html' : staticPath);
    if (!file) {
      /* SPA 兜底：未知路径回 index.html（但 API 已在上方拦掉） */
      const index = resolveStatic(publicDir, '/index.html');
      if (!index) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'content-type': MIME['.html'], 'cache-control': 'no-store' });
      return res.end(injectTokens(readFileSync(index, 'utf8'), { apiBase, version: services.version, displayVersion: services.displayVersion, buildDate: services.buildDate }));
    }
    res.writeHead(200, { 'content-type': contentType(file), 'cache-control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    const raw = readFileSync(file, 'utf8');
    const injected = /\.(?:html|css|js|mjs)$/.test(file)
      ? injectTokens(raw, { apiBase, version: services.version, displayVersion: services.displayVersion, buildDate: services.buildDate })
      : raw;
    res.end(injected);
  };
}

/** 独立启动用（宿主里由 webServer.register 接）。 */
export function serveStandalone({ port, host = '127.0.0.1', handler }) {
  return import('node:http').then(({ createServer }) => new Promise((resolve) => {
    const server = createServer(handler);
    server.listen(port, host, () => resolve(server));
  }));
}
