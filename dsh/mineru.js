/**
 * MinerU 六部件（家族 18 号 v2）：导入 → 队列 → 解析 → 候选 → 核对 → 归档。
 *
 * 本文件是**接口契约 + 纯文本抽取**，不做真实上传（本仓未接入 MinerU，如实标注）：
 * - Token 解析（resolveToken / resolveMineruToken）：文件优先、环境变量兜底，读不到如实返回 null；
 * - 六部件函数按 18 号 v2 的状态机签名实现：状态只进出枚举，失败带 reason，不裸 throw；
 * - parseLocalText：TXT / MD / CSV 本地抽取（化验候选），不上传任何内容；
 * - 真实云解析需要用户在设置页填 Token（存 .secrets，git 忽略），未配置时 upload 返回
 *   `needsSetup`，绝不假装解析成功。勾选与保存都不联网。
 *
 * PID 指标字典：免疫球蛋白 / 淋巴细胞亚群 / 血象——只匹配名称，不做参考范围判定
 * （阈值一律【待核】，与 metric_defs 同源、不在库内判定）。
 */

import { readFileSync as readFileSyncFn, writeFileSync as writeFileSyncFn } from 'node:fs';

export const MINERU_TOKEN_URL = 'https://mineru.net/apiManage/token';
export const SECRETS_FILE = '.secrets/mineru-token';

/** Token 解析：文件（.secrets/mineru-token）优先，环境变量 MINERU_TOKEN 兜底；两者都没有 → null（不猜）。 */
export function resolveToken({ readFileFn, env } = {}) {
  return resolveMineruToken({ readFileFn, env });
}

export function resolveMineruToken({ readFileFn, env } = {}) {
  const read = readFileFn || ((p) => { try { return readFileSyncFn(p, 'utf8'); } catch { return null; } });
  const secretFile = SECRETS_FILE; /* readFileSync 落点：文件优先 */
  const fromFile = read(secretFile);
  if (fromFile && typeof fromFile === 'string' && fromFile.trim()) return { source: 'file', token: fromFile.trim() };
  const fromEnv = env?.MINERU_TOKEN ?? process.env.MINERU_TOKEN;
  if (fromEnv && String(fromEnv).trim()) return { source: 'env', token: String(fromEnv).trim() };
  return null;
}

/** 设置页手工保存 Token：写 .secrets/mineru-token（0600 权限由调用方保证；.secrets 已 git 忽略）。 */
export function saveMineruToken(token, { writeFileFn } = {}) {
  const t = String(token || '').trim();
  if (!t) return { saved: false, reason: 'empty-token' };
  const write = writeFileFn || ((p, s) => { writeFileSyncFn(p, s, 'utf8'); return true; });
  write(SECRETS_FILE, t);
  return { saved: true, path: SECRETS_FILE };
}

/** ① 导入：收文件清单，返回批次 id 与逐文件接受结果（超大/不支持类型直接拒收并说明）。 */
export function importFiles(files, { maxBytes = 50 * 1024 * 1024 } = {}) {
  const supported = ['.txt', '.md', '.csv', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.docx', '.xlsx'];
  const accepted = [], rejected = [];
  for (const f of files || []) {
    const name = String(f?.name || '');
    const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
    if (!supported.includes(ext)) rejected.push({ name, reason: 'unsupported-type' });
    else if ((f?.size ?? 0) > maxBytes) rejected.push({ name, reason: 'too-large' });
    else accepted.push({ name, ext, size: f?.size ?? null, localOnly: ['.txt', '.md', '.csv'].includes(ext) });
  }
  return { batchId: 'batch-' + Date.now().toString(36), accepted, rejected };
}

/** ② 队列：accepted 文件分流——localOnly 走本地抽取，其余排队等云解析。 */
export function enqueue(batch) {
  const jobs = (batch?.accepted || []).map((f, i) => ({
    jobId: `${batch.batchId}-${i}`, file: f.name,
    channel: f.localOnly ? 'local' : 'mineru-cloud',
    status: f.localOnly ? 'ready' : 'queued',
  }));
  return { batchId: batch?.batchId ?? null, jobs };
}

/** ③ 解析：云通道在未配置 Token 时如实 needsSetup；本地通道由 parseLocalText 完成。 */
export function parseJob(job, { token } = {}) {
  if (job.channel === 'mineru-cloud' && !token) {
    return { ...job, status: 'needsSetup', reason: 'MINERU_TOKEN 未配置（设置页填 Token 后启用云解析）', tokenUrl: MINERU_TOKEN_URL };
  }
  return { ...job, status: job.status === 'ready' || token ? 'parsing' : job.status };
}

const NUM = /^[<>≥≤]?\s*\d+(?:\.\d+)?$/;

/** PID 指标字典（名称 → code）：与 metric_defs 同源（不在库内判定参考范围）。 */
export const METRIC_DICT = [
  { code: 'igg', names: ['免疫球蛋白 IgG', '免疫球蛋白G', 'IgG', 'IGG', '丙种球蛋白'] },
  { code: 'iga', names: ['免疫球蛋白 IgA', '免疫球蛋白A', 'IgA', 'IGA'] },
  { code: 'igm', names: ['免疫球蛋白 IgM', '免疫球蛋白M', 'IgM', 'IGM'] },
  { code: 'cd4', names: ['CD4', 'CD4 T 细胞绝对数', 'CD4细胞绝对数', 'CD4 绝对数'] },
  { code: 'cd19', names: ['CD19', 'CD19 B 细胞绝对数', 'CD19细胞绝对数', 'CD19 绝对数'] },
  { code: 'wbc', names: ['WBC', '白细胞', '白细胞计数'] },
];

/** 行式文本 → 化验候选（纯本地；日期行 + "名称 数值 单位" 模式）。 */
export function parseLocalText(text, { dateHint } = {}) {
  const out = [];
  let currentDate = dateHint ?? null;
  const lines = String(text || '').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const dm = line.match(/(\d{4}[-/年]\d{1,2}[-/月]\d{1,2})/);
    if (dm) currentDate = dm[1].replace(/年|月|\//g, '-').replace(/日/g, '');
    for (const entry of METRIC_DICT) {
      for (const name of entry.names) {
        const re = new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[:：]?\\s*([<>≥≤]?\\s*\\d+(?:\\.\\d+)?)\\s*([a-zA-Z×⁹/μµ%·°℃]+.*)?$');
        const m = line.match(re);
        if (m && NUM.test(m[1])) {
          out.push({ code: entry.code, matchedName: name, date: currentDate, valueText: m[1], unit: (m[2] || '').trim() || null, kind: 'metric' });
        }
      }
    }
  }
  return out;
}

/** ④ 候选：解析产物 → import_candidates 形状（in_use=0；核对前不入事实层）。 */
export function toCandidates(parsed, { sourceNote = '文档解析（本地抽取）' } = {}) {
  return (parsed || []).map((c, i) => ({
    id: 'cand-' + (i + 1), kind: c.kind, code: c.code, date: c.date,
    valueText: c.valueText, unit: c.unit, from: sourceNote, inUse: false, rejected: false,
  }));
}

/** ⑤ 核对：逐条 accept/reject；reject 不改事实层（零副作用），accept 返回待写入 payload。 */
export function verifyCandidates(cands, { acceptIds = [], rejectIds = [] } = {}) {
  const now = new Date().toISOString().slice(0, 10);
  return (cands || []).map((c) => {
    if (acceptIds.includes(c.id)) return { ...c, inUse: true, verifiedOn: now };
    if (rejectIds.includes(c.id)) return { ...c, rejected: true };
    return c;
  });
}

/** ⑥ 归档：已核对候选 → 写库调用方执行；本函数只产出归档清单（batch 封存、原件路径保留）。 */
export function archiveBatch(batchId, verifiedCount) {
  return { batchId, archivedAt: new Date().toISOString(), verifiedCount: verifiedCount ?? 0, originalsKept: true };
}
