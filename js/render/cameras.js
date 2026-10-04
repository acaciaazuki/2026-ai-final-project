// 鏡頭：依世界與視窗比例決定攝影機的位置
import * as THREE from 'three';

// 平面世界的鏡頭方向：從斜上方、偏向玩家這一側往地圖中央看
const FLAT_VIEW = new THREE.Vector3(0, 1.3, 0.85).normalize();

// 讓整張平面地圖（含外圍的牆）都在畫面內
// 視窗比較窄（例如直向手機）時，水平視角變小，鏡頭會自動拉遠
export function fitFlatCamera(camera, world) {
  const half = Math.max(world.cols, world.rows) / 2 + 1;
  const radius = half * 1.2;

  const vertical = THREE.MathUtils.degToRad(camera.fov);
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
  const distance = radius / Math.sin(Math.min(vertical, horizontal) / 2);

  camera.position.copy(FLAT_VIEW).multiplyScalar(distance);
  camera.lookAt(0, 0, 0.6);
}

// 坑洞的鏡頭方向：比平面更陡，才看得進坑裡
export const PIT_VIEW = new THREE.Vector3(0, 1.7, 0.9).normalize();

// 坑洞鏡頭對準的點：坑的中心稍微往上，讓坑口也在畫面內
export const pitTarget = (world) => new THREE.Vector3(0, -world.depth / 2 + 0.5, 0);

// 讓整個坑洞（含坑口邊框）都在畫面內；direction 是從對準點指向鏡頭的方向
export function fitPitCamera(camera, world, direction = PIT_VIEW) {
  const radius = Math.hypot(world.cols / 2 + 0.2, world.rows / 2 + 0.2, world.depth / 2) * 1.1;

  const vertical = THREE.MathUtils.degToRad(camera.fov);
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
  const distance = radius / Math.sin(Math.min(vertical, horizontal) / 2);

  const target = pitTarget(world);
  camera.position.copy(direction).normalize().multiplyScalar(distance).add(target);
  camera.lookAt(target);
}
