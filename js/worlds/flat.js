// 平面世界：cols×rows 的格子，邊界依穿牆規則決定能否穿越
// 格子以 { x, y } 表示，x 往右、y 往下

const STEPS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

// wrap.x 為 true 時左右邊界相通，wrap.y 為 true 時上下邊界相通
export function createFlatWorld({ cols, rows, wrap }) {
  const allCells = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) allCells.push({ x, y });
  }

  return {
    type: 'flat',
    cols,
    rows,
    wrap,
    directions: Object.keys(STEPS),

    cells: () => allCells,

    // 格子轉成字串，用來放進 Set 比對
    key: (cell) => `${cell.x},${cell.y}`,

    opposite: (direction) => OPPOSITE[direction],

    // 蛇的預設出生位置：地圖中央，朝右
    spawn: () => ({
      cell: { x: Math.floor(cols / 2), y: Math.floor(rows / 2) },
      direction: 'right',
    }),

    // 走一步：回傳到達的格子與之後的方向；撞到不能穿越的邊界時回傳 null
    // 平面世界的方向不會改變，但介面保留回傳方向，立方體跨面時會用到
    move(cell, direction) {
      const step = STEPS[direction];
      let x = cell.x + step.x;
      let y = cell.y + step.y;

      if (x < 0 || x >= cols) {
        if (!wrap.x) return null;
        x = (x + cols) % cols;
      }
      if (y < 0 || y >= rows) {
        if (!wrap.y) return null;
        y = (y + rows) % rows;
      }
      return { cell: { x, y }, direction };
    },

    // 格子在 3D 空間中的位置：地圖中心在原點、一格寬 1、y 軸朝上
    // up 是這一格「朝上」的方向，平面世界一律朝 +y
    toPosition: (cell) => ({
      x: cell.x - cols / 2 + 0.5,
      y: 0,
      z: cell.y - rows / 2 + 0.5,
      up: { x: 0, y: 1, z: 0 },
    }),
  };
}
