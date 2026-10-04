// 3D 畫面：渲染器、燈光、地圖與物件，每一幀依遊戲狀態更新
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createActors } from './actors.js';
import { createBoard } from './board.js';
import {
  PIT_VIEW,
  fitCubeCamera,
  fitFlatCamera,
  fitPitCamera,
  followCubeCamera,
  pitTarget,
} from './cameras.js';
import { COLORS } from './colors.js';
import { createGuides } from './guides.js';

// 坑洞可以轉動視角的範圍（以預設視角為中心）
const PIT_AZIMUTH_LIMIT = Math.PI / 4; // 左右各 45 度
const PIT_POLAR_RANGE = [THREE.MathUtils.degToRad(12), THREE.MathUtils.degToRad(55)]; // 與正上方的夾角

export function createView(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  // 高解析度螢幕最多用 2 倍，避免手機上繪圖量過大
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.background);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);

  // 天空與地面的環境光，加上一盞產生陰影的平行光
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  const SUN_POSITION = new THREE.Vector3(8, 20, 10);
  sun.position.copy(SUN_POSITION);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  // 光線方向會跟著立方體的鏡頭改變，加上偏移避免物體表面出現陰影雜點
  sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
  scene.add(sun, sun.target);

  const board = createBoard(scene, COLORS);
  const actors = createActors(scene, COLORS);
  const guides = createGuides(scene, COLORS);
  let world = null;

  // 坑洞可以用滑鼠右鍵拖曳或雙指旋轉視角；不提供縮放與平移，
  // 左鍵與單指保留給之後的手機滑動操作
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.mouseButtons = { LEFT: null, MIDDLE: null, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minAzimuthAngle = -PIT_AZIMUTH_LIMIT;
  controls.maxAzimuthAngle = PIT_AZIMUTH_LIMIT;
  [controls.minPolarAngle, controls.maxPolarAngle] = PIT_POLAR_RANGE;
  controls.enabled = false;

  // 依世界擺放鏡頭；keepAngle 為 true 時保留玩家轉過的角度（例如視窗縮放時）
  function fitCamera(keepAngle = false) {
    if (world.type === 'pit') {
      const direction = keepAngle ? camera.position.clone().sub(controls.target) : PIT_VIEW;
      fitPitCamera(camera, world, direction);
      controls.target.copy(pitTarget(world));
      controls.update();
    } else if (world.type === 'cube') {
      fitCubeCamera(camera, world);
    } else {
      fitFlatCamera(camera, world);
    }
  }

  // 依容器大小調整畫面與攝影機，避免畫面變形
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (world) fitCamera(true);
  }
  new ResizeObserver(resize).observe(container);
  resize();

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  return {
    // 顯示一張地圖（主選單的背景也會用到）
    showWorld(next) {
      world = next;
      board.build(world);
      guides.build(world);
      controls.enabled = world.type === 'pit';
      sun.position.copy(SUN_POSITION);
      fitCamera();
    },

    // 開始新的一局
    setGame(game) {
      this.showWorld(game.world);
      actors.setGame(game);
    },

    // 回到主選單：只留下地圖
    clearGame() {
      actors.clear();
      guides.hide();
      if (world) fitCamera();
      sun.position.copy(SUN_POSITION);
    },

    // 主迴圈：每一幀先呼叫 onFrame 取得目前的遊戲，再更新畫面
    start(onFrame) {
      renderer.setAnimationLoop((time) => {
        const game = onFrame(time);
        actors.update(game, time, motionQuery.matches);
        // 立方體：鏡頭跟著蛇頭；平行光放在鏡頭那一側，看到的那一面才有光
        if (game && world.type === 'cube' && game.world === world) {
          followCubeCamera(camera, actors.headPosition, actors.headQuaternion);
          sun.position.copy(camera.position).normalize().multiplyScalar(20).add(SUN_POSITION.clone().multiplyScalar(0.3));
        }
        if (game && game.world === world) {
          guides.update(actors.headPosition, actors.hasFood() ? actors.foodPosition : null, game.snake[0].z);
        }
        renderer.render(scene, camera);
      });
    },
  };
}
