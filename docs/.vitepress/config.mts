import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Notes',
  description: '随手记的技术备忘录',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'SQLi 速查', link: '/notes/sqli' },
      { text: 'Linux 与密码学', link: '/notes/linux-sec' }
    ],

    sidebar: [
      {
        text: '备忘录',
        items: [
          { text: 'SQL 注入基础速查', link: '/notes/sqli' },
          { text: 'Linux ACL 与国密命令速查', link: '/notes/linux-sec' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Xianbei1145i4' }
    ],

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: '目录'
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    lastUpdated: {
      text: '更新于'
    }
  }
})
