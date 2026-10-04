// 會動的物件：蛇、食物與障礙物
import * as THREE from 'three';

const SEGMENT_SIZE = 0.86;
const POP_MS = 250; // 新食物彈出的時間
const VANISH_MS = 200; // 被吃掉的食物縮小消失的時間

// 兩點距離超過這個值，代表是穿牆，不做內插、直接出現在另一邊
const WRAP_DISTANCE = 1.5;

export function createActors(scene, colors) {
  const segmentGeometry = new THREE.BoxGeometry(SEGMENT_SIZE, SEGMENT_SIZE, SEGMENT_SIZE);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: colors.snakeBody, roughness: 0.5 });
  const obstacleGeometry = new THREE.BoxGeometry(0.92, 0.92, 0.92);
  const obstacleMaterial = new THREE.MeshStandardMaterial({ color: colors.obstacle, roughness: 0.7 });
  const foodGeometry = new THREE.SphereGeometry(0.36, 24, 16);
  const foodMaterial = new THREE.MeshStandardMaterial({ color: colors.food, roughness: 0.35 });

  // 蛇頭：方塊加兩隻眼睛，模型的前方是 +x
  const head = new THREE.Group();
  const headBox = new THREE.Mesh(segmentGeometry, new THREE.MeshStandardMaterial({ color: colors.snakeHead }));
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
  let world = null;
  let heading = 0; // 蛇頭繞 y 軸的角度
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

    body = new THREE.InstancedMesh(segmentGeometry, bodyMaterial, world.cells().length);
    body.castShadow = true;
    body.count = 0;

    obstacles = new THREE.InstancedMesh(obstacleGeometry, obstacleMaterial, Math.max(game.obstacles.length, 1));
    obstacles.count = game.obstacles.length;
    obstacles.castShadow = true;
    obstacles.receiveShadow = true;
    game.obstacles.forEach((cell, i) => {
      const p = world.toPosition(cell);
      dummy.position.set(p.x, 0.46, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      obstacles.setMatrixAt(i, dummy.matrix);
    });
    scene.add(body, obstacles);

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
  }

  // 回到主選單時隱藏所有會動的物件
  function clear() {
    removeInstanced(body);
    removeInstanced(obstacles);
    body = null;
    obstacles = null;
    head.visible = false;
    food.visible = false;
    vanishing.visible = false;
  }

  // 第 i 節在兩格之間的位置：從上一步的位置內插到現在的位置
  function segmentPosition(game, i, t) {
    const to = world.toPosition(game.snake[i]);
    const fromCell = game.previous[Math.min(i, game.previous.length - 1)];
    const from = world.toPosition(fromCell);
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    if (Math.hypot(dx, dz) > WRAP_DISTANCE) return { x: to.x, z: to.z, dx: 0, dz: 0 };
    return { x: from.x + dx * t, z: from.z + dz * t, dx, dz };
  }

  // 每一幀依遊戲狀態更新位置與動畫
  function update(game, time, reducedMotion) {
    if (!game || !body) return;
    const t = game.progress();

    // 蛇頭
    const h = segmentPosition(game, 0, t);
    if (h.dx !== 0 || h.dz !== 0) heading = angleOf(h.dx, h.dz);
    head.position.set(h.x, SEGMENT_SIZE / 2, h.z);
    head.rotation.set(0, heading, 0);

    // 蛇身
    body.count = game.snake.length - 1;
    for (let i = 1; i < game.snake.length; i++) {
      const p = segmentPosition(game, i, t);
      dummy.position.set(p.x, SEGMENT_SIZE / 2, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      body.setMatrixAt(i - 1, dummy.matrix);
    }
    body.instanceMatrix.needsUpdate = true;

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
      food.position.set(p.x, 0.42 + bob, p.z);
      food.scale.setScalar(Math.max(scale, 0.01));
    }

    const shrink = 1 - (time - vanishAt) / VANISH_MS;
    vanishing.visible = shrink > 0;
    if (shrink > 0) vanishing.scale.setScalar(shrink);
  }

  clear();
  return { setGame, clear, update };
}
