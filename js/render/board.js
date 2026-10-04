// 地圖本身：地板、格線、牆壁與可穿越的通道
// 支持平面、坑洞、立方體三種世界
// 與 world.toPosition() 座標系統對齊

import * as THREE from 'three';

export function createBoard(scene, initialColors) {
  const group = new THREE.Group();
  scene.add(group);

  // 共用的幾何與材質（換關卡時只重建物件，不重建這些）
  const wallGeometry = new THREE.BoxGeometry(0.94, 0.9, 0.94);
  const wallMaterial = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const passageGeometry = new THREE.BoxGeometry(0.7, 0.06, 0.2);
  const passageMaterial = new THREE.MeshStandardMaterial();
  const floorMaterial = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  const gridMaterial = new THREE.LineBasicMaterial();

  // 坑壁半透明，才看得到貼著牆的蛇與障礙物
  const pitWallMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.8,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const cubeMaterials = Array.from(
    { length: 6 },
    () => new THREE.MeshStandardMaterial({ roughness: 0.9 }),
  );
  const edgeMaterial = new THREE.LineBasicMaterial();

  // 換主題時只更新材質的顏色，不用重建地圖
  function applyTheme(colors) {
    wallMaterial.color.set(colors.wall);
    wallMaterial.emissive.set(colors.glow ? colors.wall : 0x000000);
    wallMaterial.emissiveIntensity = colors.glow * 0.25;
    passageMaterial.color.set(colors.passage);
    passageMaterial.emissive.set(colors.passage);
    passageMaterial.emissiveIntensity = 1.1 + colors.glow;
    floorMaterial.color.set(colors.floor);
    gridMaterial.color.set(colors.grid);
    pitWallMaterial.color.set(colors.wall);
    rimMaterial.color.set(colors.wall);
    cubeMaterials.forEach((material, i) => material.color.set(colors.cubeFaces[i]));
    edgeMaterial.color.set(colors.edge);
  }
  applyTheme(initialColors);

  // ============ 工具函式 ============

  // 移除上一張地圖的物件並釋放記憶體
  function clear() {
    for (const child of [...group.children]) {
      group.remove(child);
      if (child.isInstancedMesh) child.dispose();
      if (child.geometry && child.geometry !== wallGeometry && child.geometry !== passageGeometry) {
        child.geometry.dispose();
      }
    }
  }

  // 依位置清單建立 InstancedMesh（同一種形狀批次繪製）
  function instanced(geometry, material, positions, rotateY = 0) {
    const mesh = new THREE.InstancedMesh(geometry, material, Math.max(positions.length, 1));
    mesh.count = positions.length;
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, rotateY, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 把座標陣列轉成線段
  function addLines(points, material = gridMaterial) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    group.add(new THREE.LineSegments(geometry, material));
  }

  // ============ 主要渲染函式 ============

  function build(world) {
    clear();
    if (world.type === 'pit') buildPit(world);
    else if (world.type === 'cube') buildCube(world);
    else buildFlat(world);
  }

  // ============ 平面世界 ============
  // 20×20 平面，邊界依 wrap 規則決定
  function buildFlat(world) {
    const { cols, rows, wrap } = world;

    // 地板：整張地圖底部
    const floor = new THREE.Mesh(new THREE.BoxGeometry(cols, 0.3, rows), floorMaterial);
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    group.add(floor);

    // 格線：x 與 z 方向的網格線
    const gridPoints = [];
    // 垂直於 z 軸的線（x 方向）
    for (let x = 0; x <= cols; x++) {
      const px = x - cols / 2;
      gridPoints.push(px, 0.01, -rows / 2, px, 0.01, rows / 2);
    }
    // 垂直於 x 軸的線（z 方向）
    for (let z = 0; z <= rows; z++) {
      const pz = z - rows / 2;
      gridPoints.push(-cols / 2, 0.01, pz, cols / 2, 0.01, pz);
    }
    addLines(gridPoints);

    // 牆壁與通道：地圖外圍
    // wrap.x：左右邊界是否穿牆
    // wrap.y：上下邊界是否穿牆
    const wallPositions = [];
    const passagePositionsH = []; // 水平通道（左右邊界）
    const passagePositionsV = []; // 垂直通道（上下邊界）

    // 上下邊界（z = -rows/2 與 rows/2 的外側）
    for (let x = 0; x < cols; x++) {
      const px = x - cols / 2 + 0.5;
      const pyWall = 0.45;
      const pyPassage = 0.03;
      const pzTop = -rows / 2 - 0.5;
      const pzBottom = rows / 2 + 0.5;

      if (!wrap.y) {
        // 牆
        wallPositions.push({ x: px, y: pyWall, z: pzTop });
        wallPositions.push({ x: px, y: pyWall, z: pzBottom });
      } else {
        // 通道
        passagePositionsH.push({ x: px, y: pyPassage, z: pzTop });
        passagePositionsH.push({ x: px, y: pyPassage, z: pzBottom });
      }
    }

    // 左右邊界（x = -cols/2 與 cols/2 的外側）
    for (let z = 0; z < rows; z++) {
      const pz = z - rows / 2 + 0.5;
      const pyWall = 0.45;
      const pyPassage = 0.03;
      const pxLeft = -cols / 2 - 0.5;
      const pxRight = cols / 2 + 0.5;

      if (!wrap.x) {
        // 牆
        wallPositions.push({ x: pxLeft, y: pyWall, z: pz });
        wallPositions.push({ x: pxRight, y: pyWall, z: pz });
      } else {
        // 通道
        passagePositionsV.push({ x: pxLeft, y: pyPassage, z: pz });
        passagePositionsV.push({ x: pxRight, y: pyPassage, z: pz });
      }
    }

    // 四個角落
    if (!wrap.x || !wrap.y) {
      const pxLeft = -cols / 2 - 0.5;
      const pxRight = cols / 2 + 0.5;
      const pzTop = -rows / 2 - 0.5;
      const pzBottom = rows / 2 + 0.5;
      const pyWall = 0.45;

      wallPositions.push({ x: pxLeft, y: pyWall, z: pzTop });
      wallPositions.push({ x: pxRight, y: pyWall, z: pzTop });
      wallPositions.push({ x: pxLeft, y: pyWall, z: pzBottom });
      wallPositions.push({ x: pxRight, y: pyWall, z: pzBottom });
    }

    // 添加至場景
    if (wallPositions.length > 0) {
      group.add(instanced(wallGeometry, wallMaterial, wallPositions));
    }
    if (passagePositionsH.length > 0) {
      group.add(instanced(passageGeometry, passageMaterial, passagePositionsH));
    }
    if (passagePositionsV.length > 0) {
      group.add(instanced(passageGeometry, passageMaterial, passagePositionsV, Math.PI / 2));
    }
  }

  // ============ 坑洞世界 ============
  // 8×8 平面，深 5 層，四周與底部都是牆
  function buildPit(world) {
    const { cols, rows, depth } = world;
    const w = cols / 2;
    const d = rows / 2;

    // 坑底地板
    const floor = new THREE.Mesh(new THREE.BoxGeometry(cols, 0.3, rows), floorMaterial);
    floor.position.y = -depth - 0.15;
    floor.receiveShadow = true;
    group.add(floor);

    // 坑壁：後、左、右三面（靠近鏡頭的前面只用格線）
    const panels = [
      { width: cols, height: depth, x: 0, y: -depth / 2, z: -d, rotateY: 0 },
      { width: rows, height: depth, x: -w, y: -depth / 2, z: 0, rotateY: Math.PI / 2 },
      { width: rows, height: depth, x: w, y: -depth / 2, z: 0, rotateY: Math.PI / 2 },
    ];

    for (const panel of panels) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(panel.width, panel.height),
        pitWallMaterial,
      );
      mesh.position.set(panel.x, panel.y, panel.z);
      mesh.rotation.y = panel.rotateY;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    // 格線：坑底、坑壁、層界
    const gridPoints = [];
    const bottom = -depth + 0.01;

    // 坑底格線
    for (let x = 0; x <= cols; x++) {
      const px = x - w;
      gridPoints.push(px, bottom, -d, px, bottom, d);
    }
    for (let z = 0; z <= rows; z++) {
      const pz = z - d;
      gridPoints.push(-w, bottom, pz, w, bottom, pz);
    }

    // 坑壁的直線
    for (let x = 0; x <= cols; x++) {
      const px = x - w;
      gridPoints.push(px, 0, -d, px, -depth, -d);
      gridPoints.push(px, 0, d, px, -depth, d);
    }
    for (let z = 0; z <= rows; z++) {
      const pz = z - d;
      gridPoints.push(-w, 0, pz, -w, -depth, pz);
      gridPoints.push(w, 0, pz, w, -depth, pz);
    }

    // 每一層的分界線
    for (let layer = 1; layer < depth; layer++) {
      const py = -layer;
      gridPoints.push(-w, py, -d, w, py, -d);
      gridPoints.push(-w, py, d, w, py, d);
      gridPoints.push(-w, py, -d, -w, py, d);
      gridPoints.push(w, py, -d, w, py, d);
    }

    addLines(gridPoints);

    // 坑口邊框：四根細長方塊
    const rim = 0.2;
    const bars = [
      { size: [cols + rim * 2, rim, rim], x: 0, y: rim / 2, z: -d - rim / 2 },
      { size: [cols + rim * 2, rim, rim], x: 0, y: rim / 2, z: d + rim / 2 },
      { size: [rim, rim, rows], x: -w - rim / 2, y: rim / 2, z: 0 },
      { size: [rim, rim, rows], x: w + rim / 2, y: rim / 2, z: 0 },
    ];

    for (const bar of bars) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...bar.size), rimMaterial);
      mesh.position.set(bar.x, bar.y, bar.z);
      mesh.castShadow = true;
      group.add(mesh);
    }
  }

  // ============ 立方體世界 ============
  // 6 個面，每面 10×10，頂點對齊 ±5
  function buildCube(world) {
    const { size } = world;
    const half = size / 2;

    // 立方體本體：6 個面各自有顏色
    const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), cubeMaterials);
    cube.receiveShadow = true;
    group.add(cube);

    // 每一面的格線：浮在表面稍微外側，以便清晰看到面的分界
    const gridPoints = [];
    const lift = half + 0.01;

    for (let i = 0; i <= size; i++) {
      const a = i - half;

      // 上面（y = +half）與下面（y = -half）的格線
      for (const sign of [1, -1]) {
        const h = lift * sign;
        gridPoints.push(a, h, -half, a, h, half);
        gridPoints.push(-half, h, a, half, h, a);
      }

      // 右面（x = +half）與左面（x = -half）的格線
      for (const sign of [1, -1]) {
        const h = lift * sign;
        gridPoints.push(h, a, -half, h, a, half);
        gridPoints.push(h, -half, a, h, half, a);
      }

      // 前面（z = +half）與後面（z = -half）的格線
      for (const sign of [1, -1]) {
        const h = lift * sign;
        gridPoints.push(a, -half, h, a, half, h);
        gridPoints.push(-half, a, h, half, a, h);
      }
    }

    addLines(gridPoints);

    // 邊稜線：立方體邊界，幫助強調面與面的轉角
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(size + 0.04, size + 0.04, size + 0.04)),
      edgeMaterial,
    );
    group.add(edges);
  }

  // ============ API ============
  return { build, applyTheme };
}
