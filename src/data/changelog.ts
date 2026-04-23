export interface ChangelogEntry {
  version: string
  date: string
  items: string[]
}

const changelog: ChangelogEntry[] = [
  {
    version: 'v0.0.2 beta',
    date: '2026/04/23',
    items: [
      '解決無法儲存帳號問題',
      '修正一些小錯誤',
      '早上不小心睡著，喝了杯咖啡提神，結果把版本號改成0.0.2了',
    ],
  },
  {
    version: 'v0.0.1 beta',
    date: '2026/04/21',
    items: ['初始版本發布'],
  },
]

export default changelog
