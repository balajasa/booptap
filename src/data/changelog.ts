export interface ChangelogEntry {
  version: string
  date: string
  items: string[]
}

const changelog: ChangelogEntry[] = [
  {
    version: 'v0.0.4 beta',
    date: '2026/04/28',
    items: ['新增個人設定的功能', '修正了一些小錯誤', '最近有點忙，讓我慢慢更新吧'],
  },
  {
    version: 'v0.0.3 beta',
    date: '2026/04/24',
    items: ['新增了日曆功能，可以更方便地查看打卡紀錄', '外面在下雨，希望下班的時候雨可以停'],
  },
  {
    version: 'v0.0.2 beta',
    date: '2026/04/23',
    items: [
      '解決無法儲存帳號問題',
      '解決照片尺寸太大無法上傳',
      '修正了一些小錯誤',
      '不小心睡著喝了杯咖啡提神，結果把版本號改成0.0.2了',
    ],
  },
  {
    version: 'v0.0.1 beta',
    date: '2026/04/21',
    items: ['初始版本發布'],
  },
]

export default changelog
