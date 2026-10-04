// 地圖本身：地板、格線、牆壁與可穿越的通道
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

  // 依平面世界建立地圖：world.wrap 決定哪些邊界是牆、哪些是通道
  function build(world) {
    clear();
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
    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    group.add(new THREE.LineSegments(gridGeometry, gridMaterial));

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

  return { build };
}
