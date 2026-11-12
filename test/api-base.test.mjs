/**
 * api-base 交界守卫（家族同名测试移植，前缀换 primary-immunodeficiency）：
 *   - API_BASE 拼接不出现重复 /api：守卫只禁「交界处重复」，不禁宿主前缀含 /api；
 *   - 双形态（宿主 /api/primary-immunodeficiency 与独立启动空串）都要拼得对；
 *   - 启动期校验失败禁裸 throw——返回可渲染横幅（宿主里白屏等于装机失败）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateApiBase, buildApiUrl, normalizeApiBase, detectForm, guardStartupApiBase } from '../lib/api-base.js';
import { API_PREFIX } from '../lib/identity.js';

const HOSTED = `/api/${API_PREFIX}`;

test('交界守卫：只禁交界处重复 /api，不禁宿主前缀含 /api', () => {
  assert.equal(validateApiBase(HOSTED).ok, true, '宿主前缀 /api/primary-immunodeficiency 应合法');
  assert.equal(validateApiBase(HOSTED + '/api').ok, false, '交界处 /api 结尾应非法');
  assert.equal(validateApiBase('').ok, true, '独立启动空串应合法');
  assert.equal(buildApiUrl(HOSTED, 'api/bootstrap'), HOSTED + '/api/bootstrap', '拼 URL 形态不对');
  assert.equal(buildApiUrl('', 'api/bootstrap'), '/api/bootstrap', '独立形态拼 URL 不对');
  assert.equal(detectForm(HOSTED), 'hosted', '宿主形态判定不对');
  assert.equal(detectForm(''), 'standalone', '独立形态判定不对');
});

test('启动守卫：失败不抛，返回可渲染横幅（禁白屏）', () => {
  const bad = guardStartupApiBase(HOSTED + '/api');
  assert.equal(bad.ok, false, '非法 apiBase 应判失败');
  assert.ok(bad.banner?.title && bad.banner?.detail, '启动守卫未给出横幅');
  const good = guardStartupApiBase(HOSTED);
  assert.equal(good.ok, true, '启动守卫误报');
  assert.equal(good.banner, null);
  assert.equal(good.base, HOSTED);
  /* 全形态扫描：任何 validateApiBase 通过的值，buildApiUrl 都不得拼出 /api/api */
  for (const base of ['', HOSTED, '/x', '/a/b']) {
    assert.ok(!buildApiUrl(base, 'api/health').includes('/api/api/'), `base=${base} 拼出重复 /api`);
  }
});

test('规范化：尾斜杠去重、完整 URL 拒收（跨源会丢认证）', () => {
  assert.equal(normalizeApiBase(HOSTED + '/'), HOSTED, '尾斜杠未去');
  assert.equal(validateApiBase('https://example.com').ok, false, '完整 URL 应拒收');
  assert.equal(validateApiBase('   ').ok, true, '空白归一为独立形态');
});
