// 3D 畫面：渲染器、燈光、地圖與物件，每一幀依遊戲狀態更新
import * as THREE from 'three';
import { createActors } from './actors.js';
import { createBoard } from './board.js';
import { fitFlatCamera } from './cameras.js';
import { COLORS } from './colors.js';

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
  sun.position.set(8, 20, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
  scene.add(sun);

  const board = createBoard(scene, COLORS);
  const actors = createActors(scene, COLORS);
  let world = null;

  // 依容器大小調整畫面與攝影機，避免畫面變形
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (world) fitFlatCamera(camera, world);
  }
  new ResizeObserver(resize).observe(container);
  resize();

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  return {
    // 顯示一張地圖（主選單的背景也會用到）
    showWorld(next) {
      world = next;
      board.build(world);
      fitFlatCamera(camera, world);
    },

    // 開始新的一局
    setGame(game) {
      this.showWorld(game.world);
      actors.setGame(game);
    },

    // 回到主選單：只留下地圖
    clearGame() {
      actors.clear();
    },

    // 主迴圈：每一幀先呼叫 onFrame 取得目前的遊戲，再更新畫面
    start(onFrame) {
      renderer.setAnimationLoop((time) => {
        const game = onFrame(time);
        actors.update(game, time, motionQuery.matches);
        renderer.render(scene, camera);
      });
    },
  };
}
