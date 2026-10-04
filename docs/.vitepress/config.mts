import { defineConfig } from 'vitepress';

const repo = 'https://github.com/8739business-droid/my-office';

export default defineConfig({
  lang: 'ja',
  title: 'my-office',
  description: '大阪弁の秘書ショーが窓口になる、Claude Code の仮想オフィス',
  // GitHub Pages のリポジトリ名に合わせる
  base: '/my-office/',
  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    nav: [
      { text: 'ガイド', link: '/guide/getting-started' },
      { text: 'リファレンス', link: '/reference/departments' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'はじめに',
          items: [
            { text: 'my-office とは', link: '/guide/what-is-my-office' },
            { text: 'クイックスタート', link: '/guide/getting-started' },
          ],
        },
        {
          text: '使い方',
          items: [
            { text: '秘書との日常', link: '/guide/daily-usage' },
            { text: '部署を追加する', link: '/guide/adding-departments' },
            { text: 'ダッシュボード', link: '/guide/dashboard' },
            { text: 'MCP 連携ガイド', link: '/guide/mcp-integration' },
          ],
        },
        {
          text: '事例',
          items: [{ text: '活用事例', link: '/guide/use-cases' }],
        },
      ],
      '/reference/': [
        {
          text: 'リファレンス',
          items: [
            { text: '部署一覧', link: '/reference/departments' },
            { text: 'ファイル構成', link: '/reference/file-structure' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: repo }],
    outline: { label: '目次', level: [2, 3] },
    docFooter: { prev: '前のページ', next: '次のページ' },
    lastUpdated: { text: '最終更新' },
    darkModeSwitchLabel: '表示モード',
    sidebarMenuLabel: 'メニュー',
    returnToTopLabel: 'ページの先頭へ',
    footer: {
      message: 'MIT License',
      copyright: '© 2026 8739business-droid',
    },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '検索', buttonAriaLabel: '検索' },
          modal: {
            noResultsText: '見つかりませんでした',
            resetButtonTitle: 'リセット',
            footer: { selectText: '選択', navigateText: '移動', closeText: '閉じる' },
          },
        },
      },
    },
  },
});
