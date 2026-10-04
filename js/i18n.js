// 多國語言：取得翻譯文字、偵測與切換語言
import zhTW from './locales/zh-TW.js';
import en from './locales/en.js';

const LOCALES = { 'zh-TW': zhTW, en };
const FALLBACK = 'zh-TW';

export const LANGUAGES = Object.keys(LOCALES);

let current = FALLBACK;

export function getLanguage() {
  return current;
}

// 決定要使用的語言：有儲存的選擇就用它；
// 沒有的話，瀏覽器語言是 zh 開頭就用正體中文，其他一律用英文
export function detectLanguage(saved) {
  if (LANGUAGES.includes(saved)) return saved;
  return (navigator.language ?? '').toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
}

// 取得目前語言的文字，並代入 {名稱} 形式的變數
// 找不到時依序退回中文、鍵名本身，至少不會顯示空白
export function t(key, params = {}) {
  const text = LOCALES[current][key] ?? LOCALES[FALLBACK][key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
}

// 切換語言，並更新頁面上所有標記過的文字
export function setLanguage(lang) {
  current = LANGUAGES.includes(lang) ? lang : FALLBACK;
  document.documentElement.lang = current;
  document.title = t('title');

  // data-i18n：替換元素的文字內容
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  // data-i18n-aria-label：替換給螢幕閱讀器的說明
  for (const el of document.querySelectorAll('[data-i18n-aria-label]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  }
  // data-i18n-placeholder：替換輸入欄的提示文字
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  }
}
