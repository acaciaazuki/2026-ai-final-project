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
  KeyQ: 'rise', // 坑洞：上升一層
  KeyE: 'sink', // 坑洞：下降一層
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

// 觸控操作
// 平面與坑洞：在畫面上滑動（往滑動的方向轉彎，連續滑動可以連續轉彎）
// 立方體：點畫面左半邊左轉、右半邊右轉
const SWIPE_DISTANCE = 28; // 滑動超過這個距離（像素）才算一次轉向

export function bindTouch(element, { getWorldType, onDirection }) {
  const touches = new Set();
  let gesture = null;

  element.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    touches.add(e.pointerId);
    // 兩根手指是轉動坑洞視角，不當作操作
    if (touches.size > 1) {
      gesture = null;
      return;
    }
    if (getWorldType() === 'cube') {
      const rect = element.getBoundingClientRect();
      onDirection(e.clientX < rect.left + rect.width / 2 ? 'left' : 'right');
      return;
    }
    gesture = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });

  element.addEventListener('pointermove', (e) => {
    if (!gesture || gesture.id !== e.pointerId) return;
    const dx = e.clientX - gesture.x;
    const dy = e.clientY - gesture.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DISTANCE) return;
    if (Math.abs(dx) > Math.abs(dy)) onDirection(dx > 0 ? 'right' : 'left');
    else onDirection(dy > 0 ? 'down' : 'up');
    // 以這個位置當作下一次滑動的起點
    gesture.x = e.clientX;
    gesture.y = e.clientY;
  });

  const end = (e) => {
    touches.delete(e.pointerId);
    if (gesture?.id === e.pointerId) gesture = null;
  };
  element.addEventListener('pointerup', end);
  element.addEventListener('pointercancel', end);
}

// 坑洞的上升、下降按鈕：按下就立刻觸發，不等放開
export function bindButtons(buttons, onDirection) {
  for (const [button, direction] of buttons) {
    button.addEventListener('pointerdown', (e) => {
      // 不讓按鈕搶走焦點，也避免連點時觸發縮放
      e.preventDefault();
      onDirection(direction);
    });
    // 鍵盤使用者按 Enter 或空白鍵時也能操作
    button.addEventListener('click', (e) => {
      if (e.detail === 0) onDirection(direction);
    });
  }
}
