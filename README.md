# 貪食蛇 3D

學校期末專題：以 three.js 製作的 3D 貪食蛇網頁遊戲，包含平面、坑洞、立方體三種世界。不使用框架、不需要建置，瀏覽器直接執行。

> 開發中，目前完成專案骨架。

## 本機執行

本專案使用 ES Modules，必須透過本機伺服器開啟，無法直接雙擊 `index.html`。

```bash
# 使用 Python
python3 -m http.server 8000
```

再用瀏覽器開啟 `http://localhost:8000`。需要支援 WebGL 2 的瀏覽器（最新版的 Chrome、Edge、Firefox、Safari）。

## 第三方程式庫

- [three.js](https://threejs.org/) r186，MIT 授權，授權全文見 [`vendor/three/LICENSE`](vendor/three/LICENSE)

## 文件

- [技術棧與實作計畫](docs/PLAN.md)
