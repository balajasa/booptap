前台 Vue 專案（PWA）

## booptap（獨立新 repo）

打卡相簿功能獨立成新 repo，手機版 SPA，有自己的 manifest。
GitHub Pages：`username.github.io/booptap/`

## 已完成

- 安裝設定 PWA（vite-plugin-pwa + manifest）
- 打卡上傳頁（HereNow.vue）
  - GPS 自動抓座標（navigator.geolocation）
  - Leaflet 互動地圖 + 可拖曳標記微調位置
  - 選照片 + 預覽
  - 上傳照片到 Cloudinary（取代 Firebase Storage）
  - 寫一筆記錄到 Firestore（checkins_sp）
  - BigDataCloud Reverse Geocoding 取得地址
  - 自動抓裝置時區存入 Firestore
  - 打卡成功顯示地址 + 當地時間 + 時區
  - UI 改版：燕麥色橫線背景、虛線照片框、底線輸入框（焦糖色 focus）
  - 標題字型 Itim
- 路由設定（/herenow）
- 路由 guard：已登入自動跳過 /login
- Dialog 系統
  - `DialogProvider.vue` 建立並整理為 booptap 樣式
  - `App.vue` 加入 `<DialogProvider />`
  - `ConfirmDialogOptions` 支援 `blur` 模糊背景選項
- 登入頁 UI（LoginView.vue）
  - `/login` route 新增
  - Email + 密碼輸入框
  - 隱私權文字預留
  - 右上角 X 關閉（router.back）
- Settings 頁 UI（UserSettings.vue）
  - 未登入：灰色圓形佔位 + 登入入口
  - 已登入：大頭照 + 名稱 + 帳號設定 + 登出按鈕
- `src/types/user.ts` 建立（UserProfile / CurrentUser）
- 登入功能邏輯
  - `firebase.ts` 補上 `auth`
  - `LoginView.vue` 接上登入邏輯（signInWithEmailAndPassword + role 檢查）
  - `UserSettings.vue` 接上 Auth 狀態、大頭照上傳、登出 Dialog
  - `HereNow.vue` 打卡送出時檢查登入
  - `useUserTitle.ts` 頭銜邏輯（依 role + 打卡次數）
- 相簿瀏覽頁（PhotoCollection.vue）改版
  - 手帳日記風格，以天為單位一天一頁
  - 導航列：← Day N →（Hachi Maru Pop 粗體）
  - 淡入淡出換頁動畫
  - 方格紙背景（CSS linear-gradient）
  - 拍立得白邊框照片（contain + 白底 + 陰影）
  - 照片與文字資訊等寬置中
  - 當地時間 + UTC offset + 台灣時間
  - 同一天多張：底部縮圖列 + 右側漸層提示
  - 裝飾符號隨機散落（DiaryDecorations.vue）
  - 字型：Hachi Maru Pop

## 待完成

- Settings 頁頭銜樣式設計（目前只有純文字）
- 膠帶貼在 polaroid 角落（獨立元件）
- 日曆跳頁（第二階段）

## Firestore 資料結構

checkins_sp/{docId}
photoURL: string // Cloudinary 圖片網址
lat: number // 緯度
lng: number // 經度
locationName: string // 地址（BigDataCloud）
timezone: string // 裝置時區（如 Asia/Taipei）
message: string // 留言（選填）
hashtags: string[] // 標籤
createdAt: timestamp // 打卡時間（UTC）

users/{uid}
email: string
userID: string // 顯示名稱
role: string // 'user' | 'member' | 'admin' | 'super_admin'
status: string // 'active' | 'disabled'
createdAt: string
lastLogin: string
photoURL?: string // Cloudinary user_photo 路徑

# 個人待辦事項

- 後台整合新增帳號功能，現在太雞肋了
- 編輯/刪除功能
- 字體載入順序
- 新增更新日誌
- 相簿新增日曆選擇日期
- 個人設定頁面
- 加入主畫面的icon
- GA4
- 加入天氣資訊
