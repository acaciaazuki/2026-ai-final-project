// 3D 主題：簡約扁平（跟著系統淺色／深色）、霓虹（Bloom 發光）、高對比無障礙
// 這裡只有純資料，不依賴 DOM 或 three.js，方便用 Node 測試

// 立方體 6 個面的底色，依序為 +x、-x、+y、-y、+z、-z（BoxGeometry 的面順序）
// 每個面的底色略有不同，玩家才看得出跨到哪一面
export const THEMES = {
  flatLight: {
    name: 'flat',
    background: '#f2f4f6',
    floor: '#e3e8ec',
    grid: '#c3cbd3',
    wall: '#5f6f7f',
    passage: '#e0a526',
    obstacle: '#7d8a97',
    snakeHead: '#1f6feb',
    snakeBody: '#6fb0ff',
    food: '#e5484d',
    eye: '#ffffff',
    pupil: '#111111',
    cubeFaces: ['#d3e6fb', '#c4dbf5', '#d6f0d2', '#c6e6c1', '#fbe0d6', '#efd8f8'],
    edge: '#6f7d8b',
    hemisphere: { sky: '#ffffff', ground: '#9aa8b5', intensity: 0.8 },
    sun: 1.5,
    glow: 0,
  },
  flatDark: {
    name: 'flat',
    background: '#15181c',
    floor: '#252a31',
    grid: '#3a414a',
    wall: '#8a96a0',
    passage: '#4caf50',
    obstacle: '#5d6670',
    snakeHead: '#2e7d32',
    snakeBody: '#66bb6a',
    food: '#e53935',
    eye: '#ffffff',
    pupil: '#111111',
    cubeFaces: ['#333a48', '#2d3442', '#2f3d36', '#29372f', '#40353d', '#382e36'],
    edge: '#6b7682',
    hemisphere: { sky: '#ffffff', ground: '#334455', intensity: 1.2 },
    sun: 2.2,
    glow: 0,
  },
  neon: {
    name: 'neon',
    background: '#070b14',
    floor: '#0c1626',
    grid: '#1b4a5c',
    wall: '#2fd3ff',
    passage: '#7dff9b',
    obstacle: '#5b6cff',
    snakeHead: '#ff3fd0',
    snakeBody: '#b84dff',
    food: '#ffd23f',
    eye: '#ffffff',
    pupil: '#0f0f0f',
    cubeFaces: ['#0f2038', '#13193a', '#0f2f33', '#17202e', '#2a1235', '#1f1236'],
    edge: '#37e6ff',
    hemisphere: { sky: '#8fb8ff', ground: '#1a1030', intensity: 0.9 },
    sun: 1.4,
    // 發光物件的自發光強度，Bloom 只對夠亮的部分作用
    glow: 1.6,
  },
  contrast: {
    name: 'contrast',
    background: '#000000',
    floor: '#161616',
    grid: '#8c8c8c',
    wall: '#ffffff',
    passage: '#ffff00',
    obstacle: '#ffffff',
    snakeHead: '#ffff00',
    snakeBody: '#00e5ff',
    food: '#ff3b30',
    eye: '#000000',
    pupil: '#ffffff',
    cubeFaces: ['#1c1c1c', '#262626', '#303030', '#121212', '#2b2b2b', '#1f1f1f'],
    edge: '#ffffff',
    hemisphere: { sky: '#ffffff', ground: '#808080', intensity: 1.5 },
    sun: 2.2,
    glow: 0,
  },
};

// 設定裡可選的主題
export const THEME_NAMES = ['flat', 'neon', 'contrast'];
export const DEFAULT_THEME = 'flat';

// 依主題名稱取得配色；簡約扁平會跟著系統的淺色／深色
export function resolveTheme(themeName, prefersDark = false) {
  if (themeName === 'neon') return THEMES.neon;
  if (themeName === 'contrast') return THEMES.contrast;
  return prefersDark ? THEMES.flatDark : THEMES.flatLight;
}

// 這個主題是否使用 Bloom（目前只有霓虹）
export const themeUsesBloom = (theme) => theme.glow > 0;
