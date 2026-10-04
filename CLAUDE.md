# 專案說明

學校期末專題：以 three.js 製作的 3D 貪食蛇網頁遊戲。完整規格與時程見 `docs/PLAN.md`。

## 語言規範

- 與使用者對話一律使用台灣用語的正體中文。
- 程式碼註解、文件、commit 訊息、PR 說明一律使用台灣正體中文。
- 變數、函式、檔案名稱使用英文。

## 開發原則

- 不使用框架與建置工具；ES Modules 直接在瀏覽器執行，three.js 透過 import map 從 `vendor/three/` 載入。
- 遊戲邏輯（`game.js`、`level.js`、`worlds/`）不得存取 DOM 或 three.js，只處理格子資料；繪圖集中在 `render/`。
- 遊戲規則與關卡生成只透過世界介面（`cells`、`move`、`toPosition`）運作。
- 可調整的數值集中於 `js/config.js`。
- `localStorage` 存取一律包在 try/catch 中，無法使用時遊戲仍須正常運作。
