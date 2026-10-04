# 貪食蛇 3D

學校期末專題：以 three.js 製作的 3D 貪食蛇網頁遊戲，包含平面、坑洞、立方體三種世界。不使用框架、不需要建置，瀏覽器直接執行。

> 開發中，目前完成到 F5：三種世界、3 個主題、Bloom 特效、畫質設定與減少動態效果。

## 顯示設定

主選單的「顯示設定」可以調整，設定會存在 `localStorage`：

- **主題**：簡約扁平（預設，跟著系統淺色／深色）、霓虹（Bloom 發光）、高對比無障礙
- **畫質**：高（陰影與 Bloom）、低（關閉陰影與特效、限制解析度）；首次開啟依裝置自動選擇
- **減少動態效果**：預設跟著系統設定；開啟後食物動畫與立方體鏡頭轉向直接到位

## 本機執行

本專案使用 ES Modules，必須透過本機伺服器開啟，無法直接雙擊 `index.html`。

```bash
# 使用 Python
python3 -m http.server 8000
```

再用瀏覽器開啟 `http://localhost:8000`。需要支援 WebGL 2 的瀏覽器（最新版的 Chrome、Edge、Firefox、Safari）。

## 第三方程式庫

- [three.js](https://threejs.org/) r186，MIT 授權，授權全文見 [`vendor/three/LICENSE`](vendor/three/LICENSE)；另附 `OrbitControls` 與後製特效模組（EffectComposer、UnrealBloomPass 等）

## 文件

- [技術棧與實作計畫](docs/PLAN.md)
