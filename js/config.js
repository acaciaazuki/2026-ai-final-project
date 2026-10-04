// 遊戲常數：可調整的數值集中在這裡

// 三種世界的大小
export const WORLD_SIZES = {
  flat: { cols: 20, rows: 20 }, // 平面：20×20
  pit: { cols: 8, rows: 8, depth: 5 }, // 坑洞：8×8、深 5 層
  cube: { size: 10 }, // 立方體：每面 10×10
};

// 各世界的速度倍率：移動間隔乘上這個值，數值越大越慢
// 坑洞要同時判斷深度，給玩家多一點反應時間
export const WORLD_SPEED_FACTORS = { flat: 1, pit: 1.4, cube: 1 };

// 目前開放的世界，依主選單的顯示順序排列
export const AVAILABLE_WORLDS = ['flat', 'pit', 'cube'];

// 蛇的初始長度
export const START_LENGTH = 3;

// 輸入佇列最多暫存的方向數，防止快速連按時回頭撞到自己
export const MAX_QUEUED_INPUTS = 2;

// 平面世界的穿牆規則：x 為 true 表示左右邊界相通，y 為 true 表示上下邊界相通
export const WRAP_RULES = {
  both: { x: true, y: true }, // 全部可穿越
  vertical: { x: false, y: true }, // 只能上下穿越
  horizontal: { x: true, y: false }, // 只能左右穿越
  none: { x: false, y: false }, // 全部是牆
};

// 難度設定
// startTickMs：初始移動間隔（毫秒），數值越小越快
// speedupEvery：每吃幾個食物加速一次，0 表示不加速
// speedupMs：每次加速縮短的毫秒數
// minTickMs：加速的上限（最短間隔）
// obstacleRatio：障礙物佔全部格子的比例
// wrapWeights：平面世界各種穿牆規則的出現機率（百分比）
export const DIFFICULTIES = {
  easy: {
    startTickMs: 180,
    speedupEvery: 0,
    speedupMs: 0,
    minTickMs: 180,
    obstacleRatio: 0.03,
    wrapWeights: { both: 60, vertical: 20, horizontal: 20, none: 0 },
  },
  normal: {
    startTickMs: 140,
    speedupEvery: 5,
    speedupMs: 10,
    minTickMs: 70,
    obstacleRatio: 0.06,
    wrapWeights: { both: 20, vertical: 25, horizontal: 25, none: 30 },
  },
  hard: {
    startTickMs: 100,
    speedupEvery: 3,
    speedupMs: 8,
    minTickMs: 50,
    obstacleRatio: 0.1,
    wrapWeights: { both: 10, vertical: 20, horizontal: 20, none: 50 },
  },
};

// 蛇頭前方保留幾格不放障礙物
export const SPAWN_SAFE_DISTANCE = 4;

// 地圖不通過連通檢查時最多重新生成幾次
export const MAX_LEVEL_ATTEMPTS = 50;

// 每關開始前顯示關卡規則的時間（毫秒）
export const LEVEL_INTRO_MS = 1500;
