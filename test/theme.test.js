// 主題與畫質驗證：配色完整、對比足夠、畫質自動選擇
// 執行：node test/theme.test.js

import { QUALITY_LEVELS } from '../js/config.js';
import { detectQuality, getQuality, QUALITY_NAMES } from '../js/render/quality.js';
import { THEMES, THEME_NAMES, resolveTheme, themeUsesBloom } from '../js/themes/index.js';
import zhTW from '../js/locales/zh-TW.js';
import en from '../js/locales/en.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    failed++;
    console.error(`✗ ${message}`);
  }
}

// WCAG 相對亮度與對比值
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const COLOR_KEYS = [
  'background', 'floor', 'grid', 'wall', 'passage', 'obstacle',
  'snakeHead', 'snakeBody', 'food', 'eye', 'pupil', 'edge',
];

for (const [key, theme] of Object.entries(THEMES)) {
  const complete = COLOR_KEYS.every((k) => /^#[0-9a-f]{6}$/i.test(theme[k]));
  assert(complete, `${key}：所有顏色都是有效的色碼`);
  assert(theme.cubeFaces.length === 6, `${key}：立方體有 6 個面的底色`);
  assert(new Set(theme.cubeFaces).size === 6, `${key}：立方體每個面的底色都不同`);
  assert(/^#[0-9a-f]{6}$/i.test(theme.hemisphere.sky) && theme.sun > 0, `${key}：燈光設定有效`);
}

// 可玩性：蛇與食物要和地板分得開
for (const [key, theme] of Object.entries(THEMES)) {
  assert(contrast(theme.snakeHead, theme.floor) >= 2, `${key}：蛇頭與地板對比 ≥ 2`);
  assert(contrast(theme.food, theme.floor) >= 2, `${key}：食物與地板對比 ≥ 2`);
  assert(contrast(theme.snakeHead, theme.snakeBody) > 1.1 || theme.snakeHead !== theme.snakeBody, `${key}：蛇頭與蛇身顏色不同`);
}
assert(contrast(THEMES.contrast.snakeHead, THEMES.contrast.floor) >= 7, '高對比：蛇頭與地板對比 ≥ 7');
assert(contrast(THEMES.contrast.wall, THEMES.contrast.floor) >= 7, '高對比：牆與地板對比 ≥ 7');
assert(contrast(THEMES.contrast.food, THEMES.contrast.floor) >= 4.5, '高對比：食物與地板對比 ≥ 4.5');

// 主題選擇
assert(THEME_NAMES.length === 3, '共 3 個主題');
assert(resolveTheme('flat', false) === THEMES.flatLight, '簡約扁平：系統淺色時用淺色配色');
assert(resolveTheme('flat', true) === THEMES.flatDark, '簡約扁平：系統深色時用深色配色');
assert(resolveTheme('neon', false) === THEMES.neon && resolveTheme('neon', true) === THEMES.neon, '霓虹不受系統設定影響');
assert(resolveTheme('contrast', true) === THEMES.contrast, '高對比不受系統設定影響');
assert(resolveTheme('不存在', false) === THEMES.flatLight, '未知的主題退回簡約扁平');
assert(themeUsesBloom(THEMES.neon), '霓虹使用 Bloom');
assert(!themeUsesBloom(THEMES.flatLight) && !themeUsesBloom(THEMES.flatDark) && !themeUsesBloom(THEMES.contrast), '其他主題不使用 Bloom');

// 畫質
assert(QUALITY_NAMES.join() === 'high,low', '畫質有高、低兩種');
assert(QUALITY_LEVELS.high.shadows && QUALITY_LEVELS.high.bloom, '高畫質：陰影與 Bloom');
assert(!QUALITY_LEVELS.low.shadows && !QUALITY_LEVELS.low.bloom, '低畫質：關閉陰影與 Bloom');
assert(QUALITY_LEVELS.low.maxPixelRatio < QUALITY_LEVELS.high.maxPixelRatio, '低畫質限制解析度');
assert(getQuality('不存在') === QUALITY_LEVELS.high, '未知的畫質退回高');
assert(detectQuality({ cores: 8, memory: 8 }) === 'high', '桌機自動用高畫質');
assert(detectQuality({}) === 'high', '沒有裝置資訊時用高畫質');
assert(detectQuality({ coarsePointer: true, cores: 8 }) === 'low', '觸控裝置自動用低畫質');
assert(detectQuality({ cores: 4 }) === 'low', '核心數少自動用低畫質');
assert(detectQuality({ cores: 8, memory: 2 }) === 'low', '記憶體少自動用低畫質');

// 語言檔
const keys = ['display.title', 'display.theme', 'display.quality', 'display.reducedMotion',
  'theme.flat', 'theme.neon', 'theme.contrast', 'quality.high', 'quality.low'];
assert(keys.every((k) => zhTW[k] && en[k]), '顯示設定的文字中英文都有');
assert(Object.keys(zhTW).sort().join() === Object.keys(en).sort().join(), '中英文語言檔鍵名一致');

console.log(`\n=== 測試結果 ===\n✓ 通過: ${passed}\n✗ 失敗: ${failed}\n共計: ${passed + failed}`);
if (failed > 0) process.exit(1);
