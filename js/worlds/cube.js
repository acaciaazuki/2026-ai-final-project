// 立方體世界：蛇在立方體的 6 個面上爬行，每面 size×size，走出邊緣就轉到相鄰的面
//
// 格子以 { x, y, z } 表示，數值是「半格」為單位的整數：
// 所在面的那一軸等於 ±size（例如上面的 y = size），另外兩軸是格子中心，
// 範圍 -(size-1) 到 size-1、間隔 2。這樣每一格都是整數，不會有小數誤差，
// 也不用逐一寫出 6 面 × 4 邊的對應表：走出邊緣時，原本的前進方向變成新的面，
// 原本的面朝外方向反過來變成新的前進方向。
//
// 方向是立體的軸向，例如 '+x'、'-y'。與所在面垂直的方向不能走，move 回傳 null。

const AXES = ['x', 'y', 'z'];

// '+x' → { axis: 'x', sign: 1 }
const parse = (direction) => ({ axis: direction[1], sign: direction[0] === '+' ? 1 : -1 });
const name = (axis, sign) => `${sign > 0 ? '+' : '-'}${axis}`;

// 方向對應的單位向量
export const DIRECTION_VECTORS = Object.fromEntries(
  AXES.flatMap((axis) =>
    [1, -1].map((sign) => [name(axis, sign), { x: 0, y: 0, z: 0, [axis]: sign }]),
  ),
);

const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

const directionOf = (v) => AXES.map((axis) => (v[axis] ? name(axis, v[axis]) : null)).find(Boolean);

export function createCubeWorld({ size }) {
  const edge = size - 1; // 格子中心座標的最大值

  // 格子所在的面，以面朝外的方向表示
  function faceOf(cell) {
    const axis = AXES.find((a) => Math.abs(cell[a]) === size);
    return name(axis, Math.sign(cell[axis]));
  }

  const allCells = [];
  for (const axis of AXES) {
    const [u, v] = AXES.filter((a) => a !== axis);
    for (const sign of [1, -1]) {
      for (let i = -edge; i <= edge; i += 2) {
        for (let j = -edge; j <= edge; j += 2) {
          allCells.push({ [axis]: size * sign, [u]: i, [v]: j });
        }
      }
    }
  }

  return {
    type: 'cube',
    size,
    directions: Object.keys(DIRECTION_VECTORS),
    faceOf,

    cells: () => allCells,

    key: (cell) => `${cell.x},${cell.y},${cell.z}`,

    opposite: (direction) => (direction[0] === '+' ? '-' : '+') + direction[1],

    // 蛇的預設出生位置：上面靠近中央，朝 +x
    spawn: () => ({ cell: { x: 1, y: size, z: 1 }, direction: '+x' }),

    // 走一步；走出邊緣時轉到相鄰的面，回傳新的前進方向
    move(cell, direction) {
      const { axis, sign } = parse(direction);
      const face = parse(faceOf(cell));
      if (axis === face.axis) return null;

      const next = { ...cell, [axis]: cell[axis] + 2 * sign };
      if (Math.abs(next[axis]) <= edge) return { cell: next, direction };

      // 跨過邊緣：前進方向成為新的面，原本的面那一軸退到最靠邊的格子
      next[axis] = size * sign;
      next[face.axis] = edge * face.sign;
      return { cell: next, direction: name(face.axis, -face.sign) };
    },

    // 相對轉向：side 為 'left' 或 'right'，從面的外側往下看、面向前進方向來判斷左右
    turn(cell, direction, side) {
      const up = DIRECTION_VECTORS[faceOf(cell)];
      const forward = DIRECTION_VECTORS[direction];
      return directionOf(side === 'left' ? cross(up, forward) : cross(forward, up));
    },

    // 格子在 3D 空間中的位置（貼在立方體表面的格子中心），up 是面朝外的方向
    toPosition(cell) {
      return { x: cell.x / 2, y: cell.y / 2, z: cell.z / 2, up: DIRECTION_VECTORS[faceOf(cell)] };
    },
  };
}
