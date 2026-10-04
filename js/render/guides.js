// 坑洞的深度輔助：把蛇頭與食物投影到坑底與後牆，並標出蛇頭所在的那一層
// 透視畫面不容易判斷前後高低，投影位置對齊了，就代表在同一條線上
import * as THREE from 'three';

const OFFSET = 0.02; // 離坑底、坑壁一點距離，避免和表面重疊閃爍

export function createGuides(scene, colors) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const overlay = (color, opacity) =>
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  const dashed = (color) =>
    new THREE.LineDashedMaterial({ color, dashSize: 0.2, gapSize: 0.15, transparent: true, opacity: 0.8 });

  // 蛇頭：坑底與後牆上的方形投影，加一條垂直虛線
  const squareGeometry = new THREE.PlaneGeometry(0.86, 0.86);
  const headMaterial = overlay(colors.snakeHead, 0.55);
  const headFloor = new THREE.Mesh(squareGeometry, headMaterial);
  headFloor.rotation.x = -Math.PI / 2;
  const headWall = new THREE.Mesh(squareGeometry, headMaterial);

  // 食物：坑底與後牆上的圓環投影，加一條垂直虛線
  const ringGeometry = new THREE.RingGeometry(0.26, 0.38, 24);
  const foodMaterial = overlay(colors.food, 0.7);
  const foodFloor = new THREE.Mesh(ringGeometry, foodMaterial);
  foodFloor.rotation.x = -Math.PI / 2;
  const foodWall = new THREE.Mesh(ringGeometry, foodMaterial);

  const verticalLine = (material) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    return new THREE.Line(geometry, material);
  };
  const headLine = verticalLine(dashed(colors.snakeHead));
  const foodLine = verticalLine(dashed(colors.food));

  // 蛇頭所在的那一層：一片半透明的薄層，加上沿著坑壁的外框
  const sliceMaterial = overlay(colors.snakeBody, 0.08);
  const slice = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sliceMaterial);
  slice.rotation.x = -Math.PI / 2;
  const sliceEdge = new THREE.LineLoop(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: colors.snakeBody, transparent: true, opacity: 0.6 }),
  );

  group.add(headFloor, headWall, foodFloor, foodWall, headLine, foodLine, slice, sliceEdge);

  let world = null;

  function setLine(lineObject, from, toY) {
    const position = lineObject.geometry.attributes.position;
    position.setXYZ(0, from.x, from.y, from.z);
    position.setXYZ(1, from.x, toY, from.z);
    position.needsUpdate = true;
    lineObject.geometry.computeBoundingSphere();
    // 虛線的間隔依線段長度計算，長度改變時要重算
    lineObject.computeLineDistances();
  }

  return {
    // 換地圖時呼叫：只有坑洞需要輔助
    build(next) {
      world = next.type === 'pit' ? next : null;
      group.visible = false;
      if (!world) return;
      const { cols, rows } = world;
      slice.scale.set(cols, rows, 1);
      sliceEdge.geometry.dispose();
      sliceEdge.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-cols / 2, 0, -rows / 2),
        new THREE.Vector3(cols / 2, 0, -rows / 2),
        new THREE.Vector3(cols / 2, 0, rows / 2),
        new THREE.Vector3(-cols / 2, 0, rows / 2),
      ]);
    },

    hide() {
      group.visible = false;
    },

    // 每一幀依蛇頭與食物的中心位置更新；layer 是蛇頭所在的層（0 是最上層）
    update(head, food, layer) {
      if (!world) return;
      group.visible = true;
      const floorY = -world.depth + OFFSET;
      const wallZ = -world.rows / 2 + OFFSET;

      headFloor.position.set(head.x, floorY, head.z);
      headWall.position.set(head.x, head.y, wallZ);
      setLine(headLine, head, floorY);

      const showFood = food !== null;
      foodFloor.visible = foodWall.visible = foodLine.visible = showFood;
      if (showFood) {
        foodFloor.position.set(food.x, floorY + 0.005, food.z);
        foodWall.position.set(food.x, food.y, wallZ + 0.005);
        setLine(foodLine, food, floorY);
      }

      // 薄層放在該層的底面
      const sliceY = -(layer + 1) + OFFSET;
      slice.position.y = sliceY;
      sliceEdge.position.y = sliceY;
    },
  };
}
