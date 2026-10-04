// 介面：切換主選單、開局提示、暫停、遊戲結束等畫面，並更新分數列
import { t } from './i18n.js';

const $ = (id) => document.getElementById(id);

// 穿牆規則的小圖示
const WRAP_ICONS = { both: '✥', vertical: '⇅', horizontal: '⇆', none: '▣' };

export function createUI({ onStart, onMenuChange, onResume, onRestart, onNewLevel, onMenu, onPause }) {
  const screens = {
    menu: $('menu-screen'),
    intro: $('intro-screen'),
    pause: $('pause-screen'),
    over: $('over-screen'),
  };
  const menuForm = $('menu-form');
  const codeInput = $('level-code-input');
  const codeError = $('level-code-error');
  const stage = $('stage');
  const pauseButton = $('pause-button');

  // 只顯示指定的畫面；name 為 null 時全部隱藏（遊戲進行中）
  function showScreen(name) {
    for (const [key, el] of Object.entries(screens)) {
      el.hidden = key !== name;
    }
    pauseButton.hidden = name !== null;
  }

  function readMenu() {
    const data = new FormData(menuForm);
    return {
      world: data.get('world'),
      difficulty: data.get('difficulty'),
      levelCode: data.get('levelCode').trim(),
    };
  }

  // 主選單的操作說明依世界切換；改 data-i18n 讓切換語言時也跟著更新
  function setMenuHint(world) {
    const hint = $('menu-hint');
    hint.dataset.i18n = world === 'pit' ? 'menu.hintPit' : 'menu.hint';
    hint.textContent = t(hint.dataset.i18n);
  }

  menuForm.addEventListener('submit', (e) => {
    e.preventDefault();
    onStart(readMenu());
  });
  menuForm.addEventListener('change', () => {
    const choice = readMenu();
    setMenuHint(choice.world);
    onMenuChange(choice);
  });
  codeInput.addEventListener('input', () => {
    codeError.hidden = true;
  });

  $('resume-button').addEventListener('click', onResume);
  $('pause-restart-button').addEventListener('click', onRestart);
  $('pause-menu-button').addEventListener('click', onMenu);
  $('retry-button').addEventListener('click', onRestart);
  $('new-level-button').addEventListener('click', onNewLevel);
  $('over-menu-button').addEventListener('click', onMenu);
  pauseButton.addEventListener('click', onPause);

  return {
    showMenu(settings, highScore) {
      menuForm.elements.world.value = settings.world;
      menuForm.elements.difficulty.value = settings.difficulty;
      setMenuHint(settings.world);
      $('menu-high-score').textContent = highScore;
      // 清空上次輸入的代碼，避免沒注意到而一直重玩同一關
      codeInput.value = '';
      codeError.hidden = true;
      $('hud').hidden = false;
      $('level-info').hidden = true;
      showScreen('menu');
      menuForm.querySelector('input:checked')?.focus();
    },

    setMenuHighScore(highScore) {
      $('menu-high-score').textContent = highScore;
    },

    // 關卡代碼有問題時顯示提示，並把焦點移回輸入欄
    // reason：'invalid' 格式不正確、'locked' 世界尚未開放
    showCodeError(reason) {
      codeError.textContent = t(reason === 'locked' ? 'menu.levelCodeLocked' : 'menu.levelCodeError');
      codeError.hidden = false;
      codeInput.focus();
    },

    // 分數列上的關卡資訊：平面顯示穿牆規則圖示，坑洞顯示目前層數，再加上關卡代碼
    setLevelInfo({ wrapRule, code }) {
      const indicator = $('wrap-indicator');
      indicator.hidden = wrapRule === null;
      $('layer-indicator').hidden = wrapRule !== null;
      if (wrapRule !== null) {
        indicator.textContent = WRAP_ICONS[wrapRule];
        indicator.title = t(`wrap.${wrapRule}`);
        indicator.setAttribute('aria-label', t(`wrap.${wrapRule}`));
      }
      $('hud-level-code').textContent = code;
      $('level-info').hidden = false;
    },

    // 坑洞的層數，layer 從 1 開始（最上層）
    setLayer(layer, depth) {
      $('layer-indicator').textContent = t('hud.layer', { layer, depth });
    },

    showIntro({ worldType, difficulty, wrapRule, code }) {
      $('intro-mode').textContent = t('intro.mode', {
        world: t(`world.${worldType}`),
        difficulty: t(`difficulty.${difficulty}`),
      });
      // 坑洞沒有穿牆規則，改提示升降按鍵
      $('intro-rule').textContent =
        wrapRule === null ? t('intro.pit') : t('intro.rule', { rule: t(`wrap.${wrapRule}`) });
      $('intro-code').textContent = t('levelCode', { code });
      showScreen('intro');
      stage.focus({ preventScroll: true });
    },

    showPlaying() {
      showScreen(null);
      // 把焦點移到遊戲畫面，鍵盤操作才不會被按鈕攔截
      stage.focus({ preventScroll: true });
    },

    showPaused() {
      showScreen('pause');
      $('resume-button').focus();
    },

    showOver({ score, won, isRecord, code }) {
      $('over-title').textContent = t(won ? 'over.won' : 'over.title');
      $('over-score').textContent = score;
      $('over-record').hidden = !isRecord;
      $('over-code').textContent = t('levelCode', { code });
      showScreen('over');
      $('retry-button').focus();
    },

    // 不支援 WebGL 2 時，隱藏所有遊戲介面
    hideAll() {
      showScreen(undefined);
      $('hud').hidden = true;
    },

    updateHud(score, highScore) {
      $('score').textContent = score;
      $('high-score').textContent = highScore;
    },

    // 透過 aria-live 區域讓螢幕閱讀器朗讀
    announce(text) {
      $('announcer').textContent = text;
    },
  };
}
