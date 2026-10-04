// 會動的物件：蛇、食物與障礙物
import * as THREE from 'three';

const SEGMENT_SIZE = 0.86;
const POP_MS = 250; // 新食物彈出的時間
const VANISH_MS = 200; // 被吃掉的食物縮小消失的時間

// 兩點距離超過這個值，代表是穿牆，不做內插、直接出現在另一邊
const WRAP_DISTANCE = 1.5;

// 坑洞各層的顏色（由上往下），讓玩家一眼看出每一節在第幾層
export const LAYER_COLORS = ['#ffe066', '#9be15d', '#36cfc9', '#4c8dff', '#9b5de5'];

// 物件放在格子底面往 up 方向 height 的位置
function placeOnCell(target, p, height) {
  return target.set(p.x + p.up.x * height, p.y + p.up.y * height, p.z + p.up.z * height);
}

export function createActors(scene, colors) {
  const segmentGeometry = new THREE.BoxGeometry(SEGMENT_SIZE, SEGMENT_SIZE, SEGMENT_SIZE);
  // 蛇身的顏色由每一節的 instance color 決定，材質本身用白色
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const layerColors = LAYER_COLORS.map((c) => new THREE.Color(c));
  const bodyColor = new THREE.Color(colors.snakeBody);
  const headColor = new THREE.Color(colors.snakeHead);
  const tint = new THREE.Color();
  const obstacleGeometry = new THREE.BoxGeometry(0.92, 0.92, 0.92);
  // 障礙物的顏色同樣由 instance color 決定；坑洞裡比蛇頭高的障礙物改用半透明的材質
  const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  const ghostMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.7,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const obstacleColor = new THREE.Color(colors.obstacle);
  const backgroundColor = new THREE.Color(colors.background);
  const foodGeometry = new THREE.SphereGeometry(0.36, 24, 16);
  const foodMaterial = new THREE.MeshStandardMaterial({ color: colors.food, roughness: 0.35 });

  // 蛇頭：方塊加兩隻眼睛，模型的前方是 +x
  const head = new THREE.Group();
  const headMaterial = new THREE.MeshStandardMaterial({ color: colors.snakeHead });
  const headBox = new THREE.Mesh(segmentGeometry, headMaterial);
  headBox.castShadow = true;
  head.add(headBox);
  const eyeGeometry = new THREE.SphereGeometry(0.12, 12, 8);
  const pupilGeometry = new THREE.SphereGeometry(0.06, 8, 6);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: colors.eye });
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: colors.pupil });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(0.36, 0.2, 0.2 * side);
    const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupil.position.set(0.46, 0.2, 0.2 * side);
    head.add(eye, pupil);
  }

  const food = new THREE.Mesh(foodGeometry, foodMaterial);
  food.castShadow = true;
  const vanishing = new THREE.Mesh(foodGeometry, foodMaterial);
  scene.add(head, food, vanishing);

  let body = null;
  let obstacles = null;
  let ghosts = null;
  let obstacleCells = [];
  let ghostLayer = null; // 目前以哪一層為界切換半透明
  let world = null;
  let heading = 0; // 蛇頭繞 y 軸的角度
  // 蛇頭與食物目前的中心位置，給坑洞的輔助線使用
  const headPosition = new THREE.Vector3();
  const foodPosition = new THREE.Vector3();
  let foodKey = null;
  let foodBornAt = -Infinity;
  let vanishAt = -Infinity;
  const dummy = new THREE.Object3D();

  function removeInstanced(mesh) {
    if (!mesh) return;
    scene.remove(mesh);
    mesh.dispose();
  }

  // 從方向向量算出蛇頭的角度（模型前方 +x 對準移動方向）
  const angleOf = (dx, dz) => Math.atan2(-dz, dx);

  // 開始新的一局：重建蛇身與障礙物
  function setGame(game) {
    world = game.world;
    removeInstanced(body);
    removeInstanced(obstacles);
    removeInstanced(ghosts);

    body = new THREE.InstancedMesh(segmentGeometry, bodyMaterial, world.cells().length);
    body.castShadow = true;
    body.count = 0;

    const capacity = Math.max(game.obstacles.length, 1);
    obstacles = new THREE.InstancedMesh(obstacleGeometry, obstacleMaterial, capacity);
    obstacles.castShadow = true;
    obstacles.receiveShadow = true;
    ghosts = new THREE.InstancedMesh(obstacleGeometry, ghostMaterial, capacity);
    obstacleCells = game.obstacles;
    ghostLayer = null;
    layoutObstacles(world.type === 'pit' ? game.snake[0].z : 0);
    scene.add(body, obstacles, ghosts);

    // 蛇頭的初始角度：朝出生時的方向
    const start = world.toPosition(game.snake[0]);
    const next = world.move(game.snake[0], game.direction);
    if (next) {
      const p = world.toPosition(next.cell);
      heading = angleOf(p.x - start.x, p.z - start.z);
    }
    foodKey = null;
    vanishAt = -Infinity;
    head.visible = true;
    headMaterial.color.copy(headColor);
  }

  // 回到主選單時隱藏所有會動的物件
  function clear() {
    removeInstanced(body);
    removeInstanced(obstacles);
    removeInstanced(ghosts);
    body = null;
    obstacles = null;
    ghosts = null;
    head.visible = false;
    food.visible = false;
    vanishing.visible = false;
  }

  // 擺放障礙物；坑洞裡越深的顏色越暗，比蛇頭所在層更高的改成半透明，才不會擋住蛇
  function layoutObstacles(headLayer) {
    ghostLayer = headLayer;
    obstacles.count = 0;
    ghosts.count = 0;
    for (const cell of obstacleCells) {
      const isPit = world.type === 'pit';
      const mesh = isPit && cell.z < headLayer ? ghosts : obstacles;
      placeOnCell(dummy.position, world.toPosition(cell), 0.46);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(mesh.count, dummy.matrix);
      const shade = isPit ? (cell.z / world.depth) * 0.55 : 0;
      mesh.setColorAt(mesh.count, tint.copy(obstacleColor).lerp(backgroundColor, shade));
      mesh.count++;
    }
    for (const mesh of [obstacles, ghosts]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }

  // 第 i 節在兩格之間的中心位置：從上一步的位置內插到現在的位置
  // dx、dz 是水平移動量，用來決定蛇頭的朝向；升降時為 0
  function segmentPosition(game, i, t) {
    const to = placeOnCell(new THREE.Vector3(), world.toPosition(game.snake[i]), SEGMENT_SIZE / 2);
    const fromCell = game.previous[Math.min(i, game.previous.length - 1)];
    const from = placeOnCell(new THREE.Vector3(), world.toPosition(fromCell), SEGMENT_SIZE / 2);
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    if (from.distanceTo(to) > WRAP_DISTANCE) return { position: to, dx: 0, dz: 0 };
    return { position: from.lerp(to, t), dx, dz };
  }

  // 坑洞依層數上色，其他世界維持原本的顏色
  const layerColor = (cell, fallback) => (world.type === 'pit' ? layerColors[cell.z] : fallback);

  // 每一幀依遊戲狀態更新位置與動畫
  function update(game, time, reducedMotion) {
    if (!game || !body) return;
    const t = game.progress();

    // 蛇頭
    const h = segmentPosition(game, 0, t);
    if (h.dx !== 0 || h.dz !== 0) heading = angleOf(h.dx, h.dz);
    head.position.copy(h.position);
    head.rotation.set(0, heading, 0);
    headPosition.copy(h.position);
    if (world.type === 'pit' && game.snake[0].z !== ghostLayer) layoutObstacles(game.snake[0].z);
    // 坑洞的蛇頭混入一點所在層的顏色，深色的頭仍然和蛇身有區別
    if (world.type === 'pit') headMaterial.color.copy(headColor).lerp(tint.copy(layerColors[game.snake[0].z]), 0.35);

    // 蛇身
    body.count = game.snake.length - 1;
    for (let i = 1; i < game.snake.length; i++) {
      dummy.position.copy(segmentPosition(game, i, t).position);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      body.setMatrixAt(i - 1, dummy.matrix);
      body.setColorAt(i - 1, layerColor(game.snake[i], bodyColor));
    }
    body.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;

    // 食物：換位置時，舊的縮小消失、新的彈出來
    const key = game.food ? world.key(game.food) : null;
    if (key !== foodKey) {
      if (foodKey !== null && !reducedMotion) {
        vanishing.position.copy(food.position);
        vanishAt = time;
      }
      foodKey = key;
      foodBornAt = reducedMotion ? -Infinity : time;
    }

    food.visible = Boolean(game.food);
    if (game.food) {
      const p = world.toPosition(game.food);
      const bob = reducedMotion ? 0 : Math.sin(time / 300) * 0.08;
      const grow = Math.min((time - foodBornAt) / POP_MS, 1);
      // 彈出時稍微超過原本大小再回來，看起來比較有彈性
      const scale = grow >= 1 ? 1 : Math.sin(grow * Math.PI * 0.75) / Math.sin(Math.PI * 0.75);
      placeOnCell(food.position, p, 0.42 + bob);
      placeOnCell(foodPosition, p, 0.42);
      food.scale.setScalar(Math.max(scale, 0.01));
    }

    const shrink = 1 - (time - vanishAt) / VANISH_MS;
    vanishing.visible = shrink > 0;
    if (shrink > 0) vanishing.scale.setScalar(shrink);
  }

  clear();
  return {
    setGame,
    clear,
    update,
    headPosition,
    foodPosition,
    hasFood: () => food.visible,
  };
}
