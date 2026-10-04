// 主題與畫質配置：簡約扁平 / 霓虹 / 高對比無障礙
// 依照 PLAN.md F5：3 個主題、Bloom、畫質設定、減少動態效果

export const THEMES = {
  flat: {
    name: 'flat',
    label: '簡約扁平',
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
    bloom: false,
  },
  neon: {
    name: 'neon',
    label: '霓虹',
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
    bloom: true,
  },
  highContrast: {
    name: 'highContrast',
    label: '高對比無障礙',
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
    bloom: false,
  },
};

export const DEFAULT_THEME = 'flat';

export function getTheme(themeName) {
  return THEMES[themeName] ?? THEMES[DEFAULT_THEME];
}

export function resolveTheme(themeName, prefersDark = false) {
  if (themeName && THEMES[themeName]) return THEMES[themeName];
  return prefersDark ? THEMES.flat : THEMES.flat;
}
