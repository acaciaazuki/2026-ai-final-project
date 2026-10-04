// 遊戲進入點：初始化語言、3D 畫面，並串接遊戲流程
import { DIFFICULTIES, LEVEL_INTRO_MS, MAX_QUEUED_INPUTS, START_LENGTH, WORLD_SIZES, WRAP_RULES } from './config.js';
import { Game, STATE } from './game.js';
import { LANGUAGES, detectLanguage, getLanguage, setLanguage, t } from './i18n.js';
import { bindKeyboard } from './input.js';
import { decodeLevelCode, encodeLevelCode, generateLevel } from './level.js';
import { mulberry32, randomSeed } from './random.js';
import { getHighScore, loadSettings, saveHighScore, saveSettings } from './storage.js';
import { createUI } from './ui.js';
import { createFlatWorld } from './worlds/flat.js';

// 目前開放的世界；F3、F4 加入坑洞與立方體
const WORLD_TYPE = 'flat';

const DEFAULT_SETTINGS = { language: null, difficulty: 'normal' };
const settings = loadSettings(DEFAULT_SETTINGS);
// 儲存的值可能來自舊版本或被手動修改過，不合法的值改回預設
if (!LANGUAGES.includes(settings.language)) settings.language = null;
if (!(settings.difficulty in DIFFICULTIES)) settings.difficulty = DEFAULT_SETTINGS.difficulty;

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
  });
}

applyLanguage(detectLanguage(settings.language));

// ---------- 遊戲流程 ----------
let view = null;
let game = null;
let seed = 0;
let lastState = null;
let lastScore = -1;

const currentHighScore = () => getHighScore(WORLD_TYPE, settings.difficulty);
const currentCode = () => encodeLevelCode(WORLD_TYPE, settings.difficulty, seed);

// 依目前的難度與種子開一局新遊戲
function newGame() {
  const level = generateLevel({ worldType: WORLD_TYPE, difficulty: settings.difficulty, seed });
  game = new Game({
    level,
    startLength: START_LENGTH,
    maxQueuedInputs: MAX_QUEUED_INPUTS,
    speed: DIFFICULTIES[settings.difficulty],
    introMs: LEVEL_INTRO_MS,
    // 食物位置也由種子決定，同一個關卡代碼每次玩到的都一樣
    rng: mulberry32(seed ^ 0x9e3779b9),
  });
  lastState = null;
  lastScore = -1;
  view.setGame(game);
  ui.setLevelInfo({ wrapRule: level.wrapRule, code: currentCode() });
  game.start();
}

function backToMenu() {
  game = null;
  view.clearGame();
  ui.showMenu(settings, currentHighScore());
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
      if (decoded.worldType !== WORLD_TYPE) {
        ui.showCodeError('locked');
        return;
      }
      // 輸入關卡代碼時，難度以代碼裡記錄的為準
      choice.difficulty = decoded.difficulty;
      seed = decoded.seed;
    } else {
      seed = randomSeed();
    }
    settings.difficulty = choice.difficulty;
    saveSettings(settings);
    newGame();
  },
  onMenuChange(choice) {
    const highScore = getHighScore(WORLD_TYPE, choice.difficulty);
    ui.setMenuHighScore(highScore);
    ui.updateHud(0, highScore);
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

bindKeyboard({
  onDirection: (direction) => game?.queueDirection(direction),
  onPause: togglePause,
});

// 切換到其他分頁或縮小視窗時自動暫停
document.addEventListener('visibilitychange', () => {
  if (document.hidden) game?.pause();
});

// 遊戲狀態改變時切換對應的畫面
function handleStateChange() {
  switch (game.state) {
    case STATE.INTRO:
      ui.showIntro({
        worldType: WORLD_TYPE,
        difficulty: settings.difficulty,
        wrapRule: game.wrapRule,
        code: currentCode(),
      });
      ui.announce(t('intro.rule', { rule: t(`wrap.${game.wrapRule}`) }));
      break;
    case STATE.PLAYING:
      ui.showPlaying();
      break;
    case STATE.PAUSED:
      ui.showPaused();
      break;
    case STATE.OVER: {
      const isRecord = saveHighScore(WORLD_TYPE, settings.difficulty, game.score);
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
    view = createView(document.getElementById('stage'));
    // 主選單的背景：一張四周是牆的空地圖
    view.showWorld(createFlatWorld({ ...WORLD_SIZES.flat, wrap: WRAP_RULES.none }));
    view.start(onFrame);
    backToMenu();
  } catch {
    showNoWebGL();
  }
} else {
  showNoWebGL();
}
