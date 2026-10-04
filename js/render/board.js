// 地圖本身：地板、格線、牆壁與可穿越的通道；坑洞是四面坑壁與坑底；立方體是 6 個面
import * as THREE from 'three';

export function createBoard(scene, colors) {
  const group = new THREE.Group();
  scene.add(group);

  // 共用的形狀與材質，換關卡時只重建物件，不重建這些
  const wallGeometry = new THREE.BoxGeometry(0.94, 0.9, 0.94);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: colors.wall, roughness: 0.6 });
  const passageGeometry = new THREE.BoxGeometry(0.7, 0.06, 0.2);
  const passageMaterial = new THREE.MeshStandardMaterial({
    color: colors.passage,
    emissive: colors.passage,
    emissiveIntensity: 1.1,
  });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: colors.floor, roughness: 0.9 });
  const gridMaterial = new THREE.LineBasicMaterial({ color: colors.grid });
  // 坑壁半透明，才看得到貼著牆的蛇與障礙物
  const pitWallMaterial = new THREE.MeshStandardMaterial({
    color: colors.wall,
    roughness: 0.8,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const rimMaterial = new THREE.MeshStandardMaterial({ color: colors.wall, roughness: 0.6 });
  const cubeMaterials = colors.cubeFaces.map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
  );
  const edgeMaterial = new THREE.LineBasicMaterial({ color: colors.edge });

  // 移除上一張地圖的物件並釋放它們佔用的記憶體
  function clear() {
    for (const child of [...group.children]) {
      group.remove(child);
      if (child.isInstancedMesh) child.dispose();
      if (child.geometry && child.geometry !== wallGeometry && child.geometry !== passageGeometry) {
        child.geometry.dispose();
      }
    }
  }

  // 依位置清單建立一組 InstancedMesh（同一種形狀一次畫很多個）
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

  // 把一組座標加成線段
  function addLines(points, material = gridMaterial) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    group.add(new THREE.LineSegments(geometry, material));
  }

  function build(world) {
    clear();
    if (world.type === 'pit') buildPit(world);
    else if (world.type === 'cube') buildCube(world);
    else buildFlat(world);
  }

  // 依平面世界建立地圖：world.wrap 決定哪些邊界是牆、哪些是通道
  function buildFlat(world) {
    const { cols, rows, wrap } = world;
    const at = (x, y, height) => ({ ...world.toPosition({ x, y }), y: height });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(cols, 0.3, rows), floorMaterial);
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    group.add(floor);

    // 格線
    const points = [];
    for (let x = 0; x <= cols; x++) points.push(x - cols / 2, 0.01, -rows / 2, x - cols / 2, 0.01, rows / 2);
    for (let y = 0; y <= rows; y++) points.push(-cols / 2, 0.01, y - rows / 2, cols / 2, 0.01, y - rows / 2);
    addLines(points);

    // 牆壁：放在地圖外圍一圈；只要相鄰的任一邊是牆，角落就補上牆
    const walls = [];
    if (!wrap.y) {
      for (let x = 0; x < cols; x++) walls.push(at(x, -1, 0.45), at(x, rows, 0.45));
    }
    if (!wrap.x) {
      for (let y = 0; y < rows; y++) walls.push(at(-1, y, 0.45), at(cols, y, 0.45));
    }
    if (!wrap.x || !wrap.y) {
      walls.push(at(-1, -1, 0.45), at(cols, -1, 0.45), at(-1, rows, 0.45), at(cols, rows, 0.45));
    }
    group.add(instanced(wallGeometry, wallMaterial, walls));

    // 通道：可以穿越的邊界放一排發光短條
    const horizontal = [];
    const vertical = [];
    if (wrap.y) {
      for (let x = 0; x < cols; x++) horizontal.push(at(x, -0.75, 0.03), at(x, rows - 0.25, 0.03));
    }
    if (wrap.x) {
      for (let y = 0; y < rows; y++) vertical.push(at(-0.75, y, 0.03), at(cols - 0.25, y, 0.03));
    }
    group.add(instanced(passageGeometry, passageMaterial, horizontal));
    group.add(instanced(passageGeometry, passageMaterial, vertical, Math.PI / 2));
  }

  // 依坑洞世界建立地圖：坑口在 y = 0，坑底在 y = -depth
  // 後、左、右三面是半透明的坑壁；靠近鏡頭的前面只畫格線，不擋住視線
  function buildPit(world) {
    const { cols, rows, depth } = world;
    const w = cols / 2;
    const d = rows / 2;

    const floor = new THREE.Mesh(new THREE.BoxGeometry(cols, 0.3, rows), floorMaterial);
    floor.position.y = -depth - 0.15;
    floor.receiveShadow = true;
    group.add(floor);

    // 坑壁：後、左、右
    const panels = [
      { width: cols, x: 0, z: -d, rotateY: 0 },
      { width: rows, x: -w, z: 0, rotateY: Math.PI / 2 },
      { width: rows, x: w, z: 0, rotateY: Math.PI / 2 },
    ];
    for (const panel of panels) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(panel.width, depth), pitWallMaterial);
      mesh.position.set(panel.x, -depth / 2, panel.z);
      mesh.rotation.y = panel.rotateY;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    const points = [];
    const line = (x1, y1, z1, x2, y2, z2) => points.push(x1, y1, z1, x2, y2, z2);
    const bottom = -depth + 0.01;
    // 坑底的格線
    for (let x = 0; x <= cols; x++) line(x - w, bottom, -d, x - w, bottom, d);
    for (let y = 0; y <= rows; y++) line(-w, bottom, y - d, w, bottom, y - d);
    // 四面坑壁的直線
    for (let x = 0; x <= cols; x++) {
      line(x - w, 0, -d, x - w, -depth, -d);
      line(x - w, 0, d, x - w, -depth, d);
    }
    for (let y = 0; y <= rows; y++) {
      line(-w, 0, y - d, -w, -depth, y - d);
      line(w, 0, y - d, w, -depth, y - d);
    }
    // 每一層的分界線，繞坑壁一圈
    for (let z = 1; z < depth; z++) {
      const y = -z;
      line(-w, y, -d, w, y, -d);
      line(-w, y, d, w, y, d);
      line(-w, y, -d, -w, y, d);
      line(w, y, -d, w, y, d);
    }
    addLines(points);

    // 坑口的邊框：四根細長的方塊圍住坑洞
    const rim = 0.2;
    const bars = [
      { size: [cols + rim * 2, rim, rim], x: 0, z: -d - rim / 2 },
      { size: [cols + rim * 2, rim, rim], x: 0, z: d + rim / 2 },
      { size: [rim, rim, rows], x: -w - rim / 2, z: 0 },
      { size: [rim, rim, rows], x: w + rim / 2, z: 0 },
    ];
    for (const bar of bars) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...bar.size), rimMaterial);
      mesh.position.set(bar.x, rim / 2, bar.z);
      mesh.castShadow = true;
      group.add(mesh);
    }
  }

  // 依立方體世界建立地圖：立方體中心在原點，每面 size×size，面與面相對的顏色相同
  function buildCube(world) {
    const { size } = world;
    const half = size / 2;
    const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), cubeMaterials);
    cube.receiveShadow = true;
    group.add(cube);

    // 每一面的格線，稍微浮在表面上
    const points = [];
    const lift = half + 0.01;
    for (let i = 0; i <= size; i++) {
      const a = i - half;
      for (const s of [1, -1]) {
        const h = lift * s;
        points.push(a, h, -half, a, h, half, -half, h, a, half, h, a); // 上下面
        points.push(h, a, -half, h, a, half, h, -half, a, h, half, a); // 左右面
        points.push(a, -half, h, a, half, h, -half, a, h, half, a, h); // 前後面
      }
    }
    addLines(points);

    // 邊稜線：讓面與面的交界清楚一點
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(size + 0.04, size + 0.04, size + 0.04)),
      edgeMaterial,
    );
    group.add(edges);
  }

  return { build };
}
