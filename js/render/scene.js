// 3D 場景：渲染器、攝影機、燈光與主迴圈
import * as THREE from 'three';

export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  // 高解析度螢幕最多用 2 倍，避免手機上繪圖量過大
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#15181c');

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 12, 14);
  camera.lookAt(0, 0, 0);

  // 天空與地面的環境光，加上一盞產生明暗的平行光
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(6, 12, 8);
  scene.add(sun);

  // F0 暫時的展示物件：一塊地板和一個方塊，F2 會換成真正的遊戲畫面
  const demo = new THREE.Group();
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.4, 10),
    new THREE.MeshStandardMaterial({ color: '#2a2f36' }),
  );
  floor.position.y = -0.2;
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: '#66bb6a' }),
  );
  cube.position.y = 0.5;
  demo.add(floor, cube);
  scene.add(demo);

  // 依容器大小調整畫面與攝影機比例，避免畫面變形
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(container);

  // 系統開啟「減少動態效果」時，展示物件不旋轉
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  renderer.setAnimationLoop((time) => {
    if (!motionQuery.matches) demo.rotation.y = time * 0.0002;
    renderer.render(scene, camera);
  });

  return { renderer, scene, camera };
}
