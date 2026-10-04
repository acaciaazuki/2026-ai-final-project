// 遊戲進入點：初始化語言與 3D 場景
import { LANGUAGES, detectLanguage, getLanguage, setLanguage } from './i18n.js';
import { loadSettings, saveSettings } from './storage.js';

const settings = loadSettings({ language: null });
// 儲存的值不合法時，改回 null（依瀏覽器語言自動決定）
if (!LANGUAGES.includes(settings.language)) settings.language = null;

const langButtons = document.querySelectorAll('.lang-button');

function applyLanguage(lang) {
  setLanguage(lang);
  for (const button of langButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === getLanguage()));
  }
}

for (const button of langButtons) {
  button.addEventListener('click', () => {
    settings.language = button.dataset.lang;
    saveSettings(settings);
    applyLanguage(settings.language);
  });
}

applyLanguage(detectLanguage(settings.language));

// three.js 需要 WebGL 2；先用一個暫時的 canvas 檢查
function supportsWebGL2() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

function showNoWebGL() {
  document.getElementById('no-webgl').hidden = false;
}

if (supportsWebGL2()) {
  // 支援時才載入 three.js，不支援的瀏覽器不用下載約 2 MB 的檔案
  try {
    const { createScene } = await import('./render/scene.js');
    createScene(document.getElementById('stage'));
  } catch {
    showNoWebGL();
  }
} else {
  showNoWebGL();
}
