// 遊戲進入點：初始化語言、3D 畫面，並串接遊戲流程
import {
  AVAILABLE_WORLDS,
  DIFFICULTIES,
  LEVEL_INTRO_MS,
  MAX_QUEUED_INPUTS,
  START_LENGTH,
  WORLD_SIZES,
  WORLD_SPEED_FACTORS,
  WRAP_RULES,
} from './config.js';
import { Game, STATE } from './game.js';
import { LANGUAGES, detectLanguage, getLanguage, setLanguage, t } from './i18n.js';
import { bindButtons, bindKeyboard, bindTouch } from './input.js';
import { decodeLevelCode, encodeLevelCode, generateLevel } from './level.js';
import { mulberry32, randomSeed } from './random.js';
import { QUALITY_NAMES, detectQuality } from './render/quality.js';
import { getHighScore, loadSettings, saveHighScore, saveSettings } from './storage.js';
import { DEFAULT_THEME, THEME_NAMES, resolveTheme } from './themes/index.js';
import { createUI } from './ui.js';
import { createCubeWorld } from './worlds/cube.js';
import { createFlatWorld } from './worlds/flat.js';
import { createPitWorld } from './worlds/pit.js';

// quality、reducedMotion 為 null 代表尚未選擇：畫質依裝置自動決定，動態效果跟著系統設定
const DEFAULT_SETTINGS = {
  language: null,
  world: 'flat',
  difficulty: 'normal',
  theme: DEFAULT_THEME,
  quality: null,
  reducedMotion: null,
};
const settings = loadSettings(DEFAULT_SETTINGS);
// 儲存的值可能來自舊版本或被手動修改過，不合法的值改回預設
if (!LANGUAGES.includes(settings.language)) settings.language = null;
if (!AVAILABLE_WORLDS.includes(settings.world)) settings.world = DEFAULT_SETTINGS.world;
if (!(settings.difficulty in DIFFICULTIES)) settings.difficulty = DEFAULT_SETTINGS.difficulty;
if (!THEME_NAMES.includes(settings.theme)) settings.theme = DEFAULT_THEME;
if (!QUALITY_NAMES.includes(settings.quality)) settings.quality = null;
if (typeof settings.reducedMotion !== 'boolean') settings.reducedMotion = null;

// ---------- 主題、畫質與動態效果 ----------
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const autoQuality = detectQuality({
  coarsePointer: window.matchMedia('(pointer: coarse)').matches,
  cores: navigator.hardwareConcurrency,
  memory: navigator.deviceMemory,
});

// 目前實際生效的值：使用者沒選過的項目，用裝置與系統的狀態決定
const currentTheme = () => resolveTheme(settings.theme, darkQuery.matches);
const currentQuality = () => settings.quality ?? autoQuality;
const currentReducedMotion = () => settings.reducedMotion ?? motionQuery.matches;
const currentDisplay = () => ({
  theme: settings.theme,
  quality: currentQuality(),
  reducedMotion: currentReducedMotion(),
});

function applyTheme() {
  document.documentElement.dataset.theme = settings.theme;
  view?.setTheme(currentTheme());
}

function applyMotion() {
  document.documentElement.dataset.motion = currentReducedMotion() ? 'reduced' : 'full';
  view?.setReducedMotion(currentReducedMotion());
}

// 系統的淺色／深色或動態效果設定改變時跟著更新
darkQuery.addEventListener('change', applyTheme);
motionQuery.addEventListener('change', applyMotion);

// ---------- 語言 ----------
const langButtons = document.querySelectorAll('.lang-button');

function applyLanguage(lang) {
  setLanguage(lang);
  for (const button of langButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === getLanguage()));
  }
}

for (const button of langButtons) {
  button.addEventListener('click', () => {
    settings.language = button.dataset.lang;
    saveSettings(settings);
    applyLanguage(settings.language);
    // 分數列上動態產生的文字也要換成新的語言
    if (game) refreshLevelInfo();
  });
}

applyLanguage(detectLanguage(settings.language));

// ---------- 遊戲流程 ----------
let view = null;

// 先套用介面主題，3D 畫面載入後會再套用一次
applyTheme();
applyMotion();
let game = null;
let seed = 0;
let lastState = null;
let lastScore = -1;
let lastPosition = null;

const currentHighScore = () => getHighScore(settings.world, settings.difficulty);
const currentCode = () => encodeLevelCode(settings.world, settings.difficulty, seed);

// 難度的速度乘上世界的倍率
function worldSpeed(world, difficulty) {
  const speed = DIFFICULTIES[difficulty];
  const factor = WORLD_SPEED_FACTORS[world];
  return {
    ...speed,
    startTickMs: speed.startTickMs * factor,
    speedupMs: speed.speedupMs * factor,
    minTickMs: speed.minTickMs * factor,
  };
}

// 主選單背景用的空地圖
function previewWorld(world) {
  if (world === 'pit') return createPitWorld(WORLD_SIZES.pit);
  if (world === 'cube') return createCubeWorld(WORLD_SIZES.cube);
  return createFlatWorld({ ...WORLD_SIZES.flat, wrap: WRAP_RULES.none });
}

// 蛇頭目前的位置：坑洞是第幾層、立方體是哪一面；平面不需要顯示，回傳 null
function headPosition() {
  const head = game.snake[0];
  if (game.world.type === 'pit') {
    const layer = head.z + 1;
    return {
      key: layer,
      hud: t('hud.layer', { layer, depth: game.world.depth }),
      announce: t('announce.layer', { layer }),
    };
  }
  if (game.world.type === 'cube') {
    const face = t(`face.${game.world.faceOf(head)}`);
    return { key: face, hud: t('hud.face', { face }), announce: t('announce.face', { face }) };
  }
  return null;
}

function refreshLevelInfo() {
  ui.setLevelInfo({ wrapRule: game.wrapRule, code: currentCode() });
  lastPosition = null;
}

// 依目前的世界、難度與種子開一局新遊戲
function newGame() {
  const level = generateLevel({ worldType: settings.world, difficulty: settings.difficulty, seed });
  game = new Game({
    level,
    startLength: START_LENGTH,
    maxQueuedInputs: MAX_QUEUED_INPUTS,
    speed: worldSpeed(settings.world, settings.difficulty),
    introMs: LEVEL_INTRO_MS,
    // 食物位置也由種子決定，同一個關卡代碼每次玩到的都一樣
    rng: mulberry32(seed ^ 0x9e3779b9),
  });
  lastState = null;
  lastScore = -1;
  ui.setActiveWorld(settings.world);
  view.setGame(game);
  refreshLevelInfo();
  game.start();
}

function backToMenu() {
  game = null;
  ui.setActiveWorld(null);
  view.clearGame();
  view.showWorld(previewWorld(settings.world));
  ui.showMenu(settings, currentHighScore(), currentDisplay());
  ui.updateHud(0, currentHighScore());
}

function togglePause() {
  if (game?.state === STATE.PLAYING) {
    game.pause();
  } else if (game?.state === STATE.PAUSED) {
    game.resume();
  }
}

const ui = createUI({
  onStart(choice) {
    if (choice.levelCode) {
      const decoded = decodeLevelCode(choice.levelCode);
      if (!decoded) {
        ui.showCodeError('invalid');
        return;
      }
      if (!AVAILABLE_WORLDS.includes(decoded.worldType)) {
        ui.showCodeError('locked');
        return;
      }
      // 輸入關卡代碼時，世界與難度以代碼裡記錄的為準
      choice.world = decoded.worldType;
      choice.difficulty = decoded.difficulty;
      seed = decoded.seed;
    } else {
      seed = randomSeed();
    }
    settings.world = choice.world;
    settings.difficulty = choice.difficulty;
    saveSettings(settings);
    newGame();
  },
  onMenuChange(choice) {
    // 切換世界時，背景換成對應的空地圖
    if (choice.world !== settings.world) {
      settings.world = choice.world;
      saveSettings(settings);
      view.showWorld(previewWorld(choice.world));
    }
    const highScore = getHighScore(choice.world, choice.difficulty);
    ui.setMenuHighScore(highScore);
    ui.updateHud(0, highScore);
  },
  onDisplayChange(display) {
    settings.theme = display.theme;
    settings.quality = display.quality;
    settings.reducedMotion = display.reducedMotion;
    saveSettings(settings);
    applyTheme();
    applyMotion();
    view?.setQuality(currentQuality());
  },
  onResume: togglePause,
  onRestart: newGame,
  onNewLevel() {
    seed = randomSeed();
    newGame();
  },
  onMenu: backToMenu,
  onPause: togglePause,
});

const onDirection = (direction) => game?.queueDirection(direction);
bindKeyboard({ onDirection, onPause: togglePause });
bindTouch(document.getElementById('stage'), {
  getWorldType: () => game?.world.type,
  onDirection,
});
bindButtons(
  [
    [document.getElementById('rise-button'), 'rise'],
    [document.getElementById('sink-button'), 'sink'],
  ],
  onDirection,
);

// 切換到其他分頁或縮小視窗時自動暫停
document.addEventListener('visibilitychange', () => {
  if (document.hidden) game?.pause();
});

// 遊戲狀態改變時切換對應的畫面
function handleStateChange() {
  switch (game.state) {
    case STATE.INTRO:
      ui.showIntro({
        worldType: settings.world,
        difficulty: settings.difficulty,
        wrapRule: game.wrapRule,
        code: currentCode(),
      });
      ui.announce(
        game.wrapRule === null
          ? t(`intro.${settings.world}`)
          : t('intro.rule', { rule: t(`wrap.${game.wrapRule}`) }),
      );
      break;
    case STATE.PLAYING:
      ui.showPlaying();
      break;
    case STATE.PAUSED:
      ui.showPaused();
      break;
    case STATE.OVER: {
      const isRecord = saveHighScore(settings.world, settings.difficulty, game.score);
      ui.showOver({ score: game.score, won: game.won, isRecord, code: currentCode() });
      ui.announce(t(game.won ? 'announce.won' : 'announce.over', { score: game.score }));
      break;
    }
  }
}

// 每一幀：推進遊戲時間、處理狀態變化，回傳目前的遊戲給畫面繪製
let lastTime = null;
function onFrame(time) {
  // 分頁切到背景再回來時，經過時間會很長，限制上限避免蛇一口氣衝好幾格
  const dt = lastTime === null ? 0 : Math.min(time - lastTime, 250);
  lastTime = time;

  if (game) {
    game.step(dt);
    if (game.state !== lastState) {
      lastState = game.state;
      handleStateChange();
    }
    if (game.score !== lastScore) {
      lastScore = game.score;
      ui.updateHud(game.score, Math.max(game.score, currentHighScore()));
      if (game.score > 0) ui.announce(t('announce.score', { score: game.score }));
    }
    // 坑洞換層、立方體換面時更新分數列；開局時只顯示不朗讀，避免蓋掉開局提示
    const position = headPosition();
    if (position && position.key !== lastPosition) {
      if (lastPosition !== null) ui.announce(position.announce);
      lastPosition = position.key;
      ui.setPosition(position.hud);
    }
  }
  return game;
}

// ---------- 啟動 ----------
// three.js 需要 WebGL 2；先用一個暫時的 canvas 檢查
function supportsWebGL2() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

function showNoWebGL() {
  ui.hideAll();
  document.getElementById('no-webgl').hidden = false;
}

if (supportsWebGL2()) {
  // 支援時才載入 three.js，不支援的瀏覽器不用下載約 2 MB 的檔案
  try {
    const { createView } = await import('./render/scene.js');
    view = createView(document.getElementById('stage'), {
      theme: currentTheme(),
      quality: currentQuality(),
      reducedMotion: currentReducedMotion(),
    });
    view.start(onFrame);
    backToMenu();
  } catch {
    showNoWebGL();
  }
} else {
  showNoWebGL();
}
