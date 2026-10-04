// localStorage 存取：無痕模式或瀏覽器封鎖時，改存在記憶體中，遊戲照常運作

const PREFIX = 'snake3d:';

// localStorage 無法使用時的備用儲存區（重新整理後就會消失）
const memory = {};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return memory[key] ?? fallback;
  }
}

function write(key, value) {
  memory[key] = value;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 無法寫入時只保留記憶體中的資料
  }
}

// 讀取設定，缺少的欄位用預設值補上
export function loadSettings(defaults) {
  const saved = read('settings', {});
  return { ...defaults, ...(typeof saved === 'object' && saved !== null ? saved : {}) };
}

export function saveSettings(settings) {
  write('settings', settings);
}

// 最高分依「模式-難度」分開記錄
function highScoreKey(mode, difficulty) {
  return `${mode}-${difficulty}`;
}

export function getHighScore(mode, difficulty) {
  const scores = read('high-scores', {});
  return Number(scores?.[highScoreKey(mode, difficulty)]) || 0;
}

// 分數超過紀錄時更新，並回傳是否為新紀錄
export function saveHighScore(mode, difficulty, score) {
  if (score <= getHighScore(mode, difficulty)) return false;
  const scores = read('high-scores', {});
  write('high-scores', { ...scores, [highScoreKey(mode, difficulty)]: score });
  return true;
}
