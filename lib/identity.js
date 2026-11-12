/**
 * 身份常量：插件 id、API 前缀、数据根目录名、UI 入口（家族口径，PID/小御宝版）。
 * `id` 必须与 cordis.patch.yml 的 insert id 一致（primary-immunodeficiency-main）。
 * API_PREFIX 是宿主挂载前缀；宿主里 API_BASE=/api/primary-immunodeficiency，
 * 页面拼 `${API_BASE}/api/bootstrap`（交界处只有一个 /api 对，不是重复）。
 * 守卫只禁「交界处重复 /api」，不许 includes('/api') 一刀切（家族踩 4）。
 */
export const PLUGIN_ID = 'primary-immunodeficiency-main';
export const PACKAGE_NAME = '@xyb-community/primary-immunodeficiency-workbench';
export const API_PREFIX = 'primary-immunodeficiency';
export const HOME_DIR = 'primary-immunodeficiency';
export const DB_FILE = 'primary-immunodeficiency.sqlite3';
export const UI_ENTRY = 'index.html';
export const DEV_PORT = 7812;
