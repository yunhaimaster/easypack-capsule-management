import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Easy Health 膠囊管理系統',
    short_name: 'Easy Health',
    description: '專業膠囊配方與生產管理系統',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2a96d1',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'zh-HK',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ],
    shortcuts: [
      {
        name: '新增訂單',
        short_name: '新增',
        description: '快速建立新的配方訂單',
        url: '/orders/new',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      },
      {
        name: '訂單列表',
        short_name: '訂單',
        description: '查看所有生產訂單',
        url: '/orders',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    ]
  }
}

