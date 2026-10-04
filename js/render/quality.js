// F5: 主題與特效系統 — 3 個主題、Bloom 後製特效、畫質設定
// 簡約扁平 / 霓虹 / 高對比無障礙

export const THEMES = {
  flat: {
    name: 'flat',
    label: '簡約扁平',
    enableBloom: false,
    background: '#f5f5f5',
    floor: '#e7ebee',
    grid: '#d1d6dc',
    wall: '#607080',
    passage: '#f6c453',
    obstacle: '#8894a0',
    snakeHead: '#2d7ff9',
    snakeBody: '#7ab8ff',
    food: '#ff5a5f',
    eye: '#ffffff',
    pupil: '#111111',
    cubeFaces: ['#cfe8ff', '#bfd9ff', '#d9f5d6', '#d9f5d6', '#ffe0d9', '#f6d7ff'],
    edge: '#7b8796',
  },
  neon: {
    name: 'neon',
    label: '霓虹',
    enableBloom: true,
    background: '#070d16',
    floor: '#0d1d2c',
    grid: '#1d4d57',
    wall: '#6ad6ff',
    passage: '#7dff9b',
    obstacle: '#5b7cff',
    snakeHead: '#ff4fd8',
    snakeBody: '#ff89d7',
    food: '#ffd166',
    eye: '#ffffff',
    pupil: '#0f0f0f',
    cubeFaces: ['#ff4fd8', '#ff7aa2', '#ffd166', '#7dff9b', '#7ad7ff', '#7d7dff'],
    edge: '#71f9ff',
  },
  highContrast: {
    name: 'highContrast',
    label: '高對比無障礙',
    enableBloom: false,
    background: '#000000',
    floor: '#111111',
    grid: '#ffffff',
    wall: '#ffffff',
    passage: '#ffff00',
    obstacle: '#ffffff',
    snakeHead: '#ffff00',
    snakeBody: '#ffffff',
    food: '#ff5e5b',
    eye: '#000000',
    pupil: '#ffffff',
    cubeFaces: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    edge: '#ffffff',
  },
};

export const THEME_NAMES = Object.keys(THEMES);
export const DEFAULT_THEME = 'flat';

export function getTheme(themeName) {
  return THEMES[themeName] ?? THEMES[DEFAULT_THEME];
}

// 畫質設定
export const QUALITY_SETTINGS = {
  high: {
    name: 'high',
    label: '高',
    enableShadows: true,
    enableBloom: true, // 主題允許時啟用
    pixelRatio: 2,
  },
  low: {
    name: 'low',
    label: '低',
    enableShadows: false,
    enableBloom: false,
    pixelRatio: 1,
  },
};

export const DEFAULT_QUALITY = 'high';

export function getQuality(qualityName) {
  return QUALITY_SETTINGS[qualityName] ?? QUALITY_SETTINGS[DEFAULT_QUALITY];
}

// 根據裝置能力自動選擇畫質
export function autoSelectQuality() {
  // 低端裝置特徵：低 DPR、GPU 不支援
  if (window.devicePixelRatio < 2 || navigator.hardwareConcurrency < 4) {
    return 'low';
  }
  return 'high';
}

// 檢查是否減少動態效果（prefers-reduced-motion）
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
