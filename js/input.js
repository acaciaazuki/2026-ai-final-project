// 鍵盤操作：把按鍵轉換成遊戲動作

// 使用 e.code（實體按鍵位置）而不是 e.key，
// 這樣開著注音等中文輸入法時 WASD 也能正常操作
const KEY_TO_DIRECTION = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

const PAUSE_KEYS = ['Space', 'KeyP', 'Escape'];

export function bindKeyboard({ onDirection, onPause }) {
  window.addEventListener('keydown', (e) => {
    // 在輸入框、單選按鈕上操作時，讓瀏覽器照原本的方式處理
    if (e.target.closest('input, select, textarea')) return;

    const direction = KEY_TO_DIRECTION[e.code];
    if (direction) {
      // 避免方向鍵捲動頁面
      e.preventDefault();
      onDirection(direction);
      return;
    }

    if (PAUSE_KEYS.includes(e.code) && !e.repeat) {
      // 焦點在按鈕上時，空白鍵是「按下按鈕」，不當作暫停
      if (e.code === 'Space' && e.target.closest('button')) return;
      e.preventDefault();
      onPause();
    }
  });
}
