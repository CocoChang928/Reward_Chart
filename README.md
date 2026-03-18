# 🏆 冒險蓋章挑戰！ Reward Chart

專為小朋友設計的獎勵集章 Web App，讓培養好習慣變得超有趣！

🌐 **線上體驗：** [https://cocochang928.github.io/Reward_Chart/](https://cocochang928.github.io/Reward_Chart/)

---

## ✨ 功能特色

| 功能 | 說明 |
|------|------|
| 🏆 **30 格集章挑戰** | 每位小朋友各有 30 格印章，集滿解鎖大獎！ |
| 👨‍👩‍👧‍👦 **支援 1~3 位小朋友** | 自由設定名字、大頭貼、主題色與里程碑獎勵 |
| 🔒 **家長臉部辨識** | 使用 Face-API.js 進行臉部辨識，確保只有爸媽能蓋章 |
| 📱 **QR Code 分享** | 產生唯讀連結與 QR Code，讓小朋友在自己的平板上追蹤進度 |
| 🗣️ **語音播報** | 蓋章時自動用中文語音唸出讚美與原因 |
| 🎊 **里程碑動畫** | 集滿 10、20、30 格時觸發特效慶祝動畫 |
| 📄 **PDF 匯出** | 一鍵匯出清單式報表，包含每個印章的日期與原因 |
| ⭐ **社群按讚** | 內建按讚計數器，看看有多少人喜歡這個 App |

## 📖 使用方式

1. **開啟網頁** — 首次進入會看到歡迎引導頁面
2. **設定小朋友** — 點擊「⚙️ 家長設定」新增小朋友資料
3. **註冊家長臉孔** — 點擊空白印章格，系統會引導您註冊臉孔（支援兩位家長）
4. **蓋章獎勵** — 小朋友表現好時，通過臉部驗證後輸入原因即可蓋章
5. **分享給小朋友** — 點擊「📱 分享」產生 QR Code，讓小朋友用平板觀看進度
6. **匯出紀錄** — 點擊「📄 匯出 PDF」下載完整的蓋章紀錄報表

## 🛠️ 技術架構

- **前端：** 純 HTML + CSS + JavaScript（無框架）
- **臉部辨識：** [face-api.js](https://github.com/vladmandic/face-api)
- **QR Code：** [qrcode.js](https://github.com/soldair/node-qrcode)
- **PDF 匯出：** [html2pdf.js](https://github.com/eKoopmans/html2pdf.js)
- **雲端同步：** [nPoint.io](https://www.npoint.io/) 免費 JSON 儲存
- **語音播報：** Web Speech API
- **部署：** GitHub Pages

## 📸 畫面預覽

開啟 [線上版本](https://cocochang928.github.io/Reward_Chart/) 即可體驗完整功能！

## 🚀 本機開發

```bash
# 克隆專案
git clone https://github.com/CocoChang928/Reward_Chart.git
cd Reward_Chart

# 啟動本機伺服器
python -m http.server 8000

# 開啟瀏覽器
# http://localhost:8000
```

## 📝 授權

MIT License

---

⭐ **覺得不錯的話，請給我們一顆星星！** ⭐
