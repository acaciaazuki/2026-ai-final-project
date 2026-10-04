// 坑洞世界：cols×rows 的平面、深 depth 層的立體空間，四周、底部與坑口都是牆
// 格子以 { x, y, z } 表示：x 往右、y 往前（遠離鏡頭）的反方向、z 是層數（0 是最上層）

const STEPS = {
  up: { x: 0, y: -1, z: 0 },
  down: { x: 0, y: 1, z: 0 },
  left: { x: -1, y: 0, z: 0 },
  right: { x: 1, y: 0, z: 0 },
  rise: { x: 0, y: 0, z: -1 }, // 上升一層
  sink: { x: 0, y: 0, z: 1 }, // 下降一層
};

const OPPOSITE = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
  rise: 'sink',
  sink: 'rise',
};

export function createPitWorld({ cols, rows, depth }) {
  const allCells = [];
  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) allCells.push({ x, y, z });
    }
  }

  return {
    type: 'pit',
    cols,
    rows,
    depth,
    directions: Object.keys(STEPS),

    cells: () => allCells,

    key: (cell) => `${cell.x},${cell.y},${cell.z}`,

    opposite: (direction) => OPPOSITE[direction],

    // 蛇的預設出生位置：中間那一層、靠左側朝右，前方留最長的距離
    spawn: () => ({
      cell: { x: 2, y: Math.floor(rows / 2), z: Math.floor(depth / 2) },
      direction: 'right',
    }),

    // 走一步：碰到四周、底部或坑口時回傳 null；方向不會改變
    move(cell, direction) {
      const step = STEPS[direction];
      const next = { x: cell.x + step.x, y: cell.y + step.y, z: cell.z + step.z };
      if (next.x < 0 || next.x >= cols || next.y < 0 || next.y >= rows) return null;
      if (next.z < 0 || next.z >= depth) return null;
      return { cell: next, direction };
    },

    // 格子在 3D 空間中的位置（格子底面的中心）：坑口在 y = 0，往下一層 y 減 1
    toPosition: (cell) => ({
      x: cell.x - cols / 2 + 0.5,
      y: -(cell.z + 1),
      z: cell.y - rows / 2 + 0.5,
      up: { x: 0, y: 1, z: 0 },
    }),
  };
}
