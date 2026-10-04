// 英文介面文字，鍵名必須與 zh-TW.js 完全相同
export default {
  title: 'Snake 3D',
  'board.label': 'Game board',

  // 分數列
  'hud.label': 'Game info',
  'hud.score': 'Score',
  'hud.highScore': 'Best',
  'hud.pause': 'Pause',

  // 主選單
  'menu.title': 'Game settings',
  'menu.difficulty': 'Difficulty',
  'menu.language': 'Language',
  'menu.levelCode': 'Level code (optional)',
  'menu.levelCodePlaceholder': 'e.g. FN-4F7K2Q',
  'menu.levelCodeError': 'Invalid level code',
  'menu.levelCodeLocked': 'This world is not available yet',
  'menu.highScore': 'Best: ',
  'menu.start': 'Start',
  'menu.hint': 'Arrow keys or WASD to move, Space to pause',

  // 世界與難度
  'world.flat': 'Flat',
  'difficulty.easy': 'Easy',
  'difficulty.normal': 'Normal',
  'difficulty.hard': 'Hard',

  // 穿牆規則
  'wrap.both': 'Wrap on all edges',
  'wrap.vertical': 'Wrap top & bottom only',
  'wrap.horizontal': 'Wrap left & right only',
  'wrap.none': 'Walls on all sides',

  // 開局提示
  'intro.mode': '{world} · {difficulty}',
  'intro.rule': 'This level: {rule}',
  levelCode: 'Level code {code}',

  // 暫停畫面
  'pause.title': 'Paused',
  'pause.resume': 'Resume',
  'pause.restart': 'Restart',
  'common.menu': 'Main menu',

  // 遊戲結束畫面
  'over.title': 'Game over',
  'over.won': 'You win!',
  'over.score': 'Score: ',
  'over.record': 'New record!',
  'over.retry': 'Play again',
  'over.newLevel': 'New level',

  // 螢幕閱讀器朗讀的訊息
  'announce.score': 'Score {score}',
  'announce.over': 'Game over. Score {score}',
  'announce.won': 'You win! Score {score}',

  // 瀏覽器不支援 WebGL 2 時的說明
  'noWebgl.title': 'Cannot display 3D graphics',
  'noWebgl.message':
    'This browser does not support WebGL 2. Please use the latest Chrome, Edge, Firefox, or Safari.',
};
