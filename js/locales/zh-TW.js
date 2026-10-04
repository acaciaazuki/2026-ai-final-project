// 台灣正體中文介面文字
// {名稱} 是會被代入的變數，例如 {score} 會換成分數
export default {
  title: '貪食蛇 3D',
  'board.label': '遊戲畫面',

  // 分數列
  'hud.label': '遊戲資訊',
  'hud.score': '分數',
  'hud.highScore': '最高分',
  'hud.pause': '暫停',
  'hud.layer': '第 {layer} 層／共 {depth} 層',
  'hud.face': '{face}',

  // 主選單
  'menu.title': '遊戲設定',
  'menu.world': '世界',
  'menu.difficulty': '難度',
  'menu.language': '語言',
  'menu.levelCode': '關卡代碼（選填）',
  'menu.levelCodePlaceholder': '例如 FN-4F7K2Q',
  'menu.levelCodeError': '關卡代碼格式不正確',
  'menu.levelCodeLocked': '這個世界尚未開放',
  'menu.highScore': '最高分：',
  'menu.start': '開始遊戲',
  'menu.hint': '方向鍵或 WASD 移動，空白鍵暫停',
  'menu.hintCube': '← → 或 A D 左轉、右轉，空白鍵暫停',
  'menu.hintPit': '方向鍵或 WASD 移動，Q 上升、E 下降，空白鍵暫停；按住滑鼠右鍵拖曳可轉動視角',

  // 顯示設定
  'display.title': '顯示設定',
  'display.theme': '主題',
  'display.quality': '畫質',
  'display.reducedMotion': '減少動態效果',
  'theme.flat': '簡約扁平',
  'theme.neon': '霓虹',
  'theme.contrast': '高對比',
  'quality.high': '高',
  'quality.low': '低',

  // 世界與難度
  'world.flat': '平面',
  'world.pit': '坑洞',
  'world.cube': '立方體',

  // 立方體的 6 個面
  'face.+y': '上面',
  'face.-y': '下面',
  'face.+z': '前面',
  'face.-z': '後面',
  'face.-x': '左面',
  'face.+x': '右面',
  'difficulty.easy': '簡單',
  'difficulty.normal': '普通',
  'difficulty.hard': '困難',

  // 穿牆規則
  'wrap.both': '全部可穿越',
  'wrap.vertical': '只能上下穿越',
  'wrap.horizontal': '只能左右穿越',
  'wrap.none': '全部是牆',

  // 開局提示
  'intro.mode': '{world}・{difficulty}',
  'intro.rule': '本關：{rule}',
  'intro.pit': 'Q 上升、E 下降',
  'intro.cube': '← → 左轉、右轉',
  levelCode: '關卡代碼 {code}',

  // 暫停畫面
  'pause.title': '暫停',
  'pause.resume': '繼續',
  'pause.restart': '重新開始',
  'common.menu': '回主選單',

  // 遊戲結束畫面
  'over.title': '遊戲結束',
  'over.won': '恭喜破關！',
  'over.score': '分數：',
  'over.record': '新紀錄！',
  'over.retry': '再玩一次',
  'over.newLevel': '新關卡',

  // 螢幕閱讀器朗讀的訊息
  'announce.score': '分數 {score}',
  'announce.layer': '第 {layer} 層',
  'announce.face': '進入{face}',
  'announce.over': '遊戲結束，分數 {score}',
  'announce.won': '恭喜破關，分數 {score}',

  // 瀏覽器不支援 WebGL 2 時的說明
  'noWebgl.title': '無法顯示 3D 畫面',
  'noWebgl.message': '這個瀏覽器不支援 WebGL 2，請改用最新版的 Chrome、Edge、Firefox 或 Safari。',
};
