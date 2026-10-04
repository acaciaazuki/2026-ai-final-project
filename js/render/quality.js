// 畫質設定：高（陰影與 Bloom）、低（關閉陰影與特效、限制解析度）
// 只有純資料與判斷，不依賴 DOM，方便用 Node 測試

import { QUALITY_LEVELS } from '../config.js';

export const QUALITY_NAMES = Object.keys(QUALITY_LEVELS);
export const DEFAULT_QUALITY = 'high';

export function getQuality(name) {
  return QUALITY_LEVELS[name] ?? QUALITY_LEVELS[DEFAULT_QUALITY];
}

// 首次開啟時依裝置自動選擇：手機、平板、核心數或記憶體偏少的裝置用低畫質
// 沒有資訊的欄位（例如 Safari 沒有 deviceMemory）不納入判斷
export function detectQuality({ coarsePointer = false, cores, memory } = {}) {
  if (coarsePointer) return 'low';
  if (cores !== undefined && cores <= 4) return 'low';
  if (memory !== undefined && memory <= 4) return 'low';
  return 'high';
}
