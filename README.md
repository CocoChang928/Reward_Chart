# 🏆 冒險蓋章挑戰！ Reward Chart

專為小朋友設計的獎勵集章 Web App，讓培養好習慣變得超有趣！

🌐 **線上體驗：** [https://cocochang928.github.io/Reward_Chart/](https://cocochang928.github.io/Reward_Chart/)

---

## ✨ 功能特色

| 功能 | 說明 |
|------|------|
| 🏆 **30 格集章挑戰** | 每位小朋友各有 30 格印章，集滿解鎖大獎！ |
| 👨‍👩‍👧‍👦 **支援 1~3 位小朋友** | 自由設定名字、大頭貼、主題色與里程碑獎勵 |
| 📋 **清單 / 印章切換** | 一鍵切換印章板與清單模式，方便查看蓋章紀錄 |
| 📱 **URL 壓縮分享** | 資料壓縮在連結中，掃 QR Code 即可唯讀查看 |
| 🗣️ **語音播報** | 蓋章時自動用中文語音唸出讚美與原因 |
| 🎊 **里程碑動畫** | 集滿 10、20、30 格時觸發特效慶祝動畫 |
| 📄 **PDF 匯出** | 一鍵匯出清單式報表，包含每個印章的日期與原因 |
| 🔒 **100% 純前端** | 不依賴任何伺服器，資料全存在瀏覽器 localStorage |

## 📖 使用方式

1. **開啟網頁** — 首次進入會看到歡迎引導頁面
2. **設定小朋友** — 點擊「⚙️ 家長設定」新增小朋友資料
3. **蓋章獎勵** — 小朋友表現好時，點擊空格輸入原因即可蓋章
4. **切換檢視** — 點「📋 清單模式」查看所有蓋章紀錄表格
5. **分享給小朋友** — 點「📱 分享」產生 QR Code 或連結
6. **匯出紀錄** — 點「📄 匯出 PDF」下載完整報表

## 📱 分享機制

分享採用 **URL 壓縮** 技術（LZ-String），資料直接編碼在連結中：
- 不需要任何伺服器或帳號
- 被分享者可以：查看印章、切換清單、匯出 PDF、再轉分享
- 被分享者也可以點「🚀 建立自己的」開始玩

## 🛠️ 技術架構

- **前端：** 純 HTML + CSS + JavaScript（無框架）
- **資料壓縮：** [lz-string](https://github.com/pieroxy/lz-string)
- **QR Code：** [qrcode.js](https://github.com/soldair/node-qrcode)
- **PDF 匯出：** [html2pdf.js](https://github.com/eKoopmans/html2pdf.js)
- **語音播報：** Web Speech API
- **部署：** GitHub Pages

## 🚀 本機開發

```bash
git clone https://github.com/CocoChang928/Reward_Chart.git
cd Reward_Chart
python -m http.server 8000
# 開啟 http://localhost:8000
```

## 📝 授權

MIT License

---

⭐ **覺得不錯的話，請給我們一顆星星！** ⭐
