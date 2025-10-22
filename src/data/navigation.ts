export interface NavigationLink {
  href: string
  label: string
  children?: NavigationLink[]
  icon?: string
}

interface NavigationOptions {
  includeLogout?: boolean
  isAdmin?: boolean
}

const BASE_NAVIGATION_LINKS: NavigationLink[] = [
  { href: '/', label: '首頁' },
  {
    href: '/orders',
    label: '訂單管理',
    children: [
      { href: '/orders', label: '訂單列表' },
      { href: '/orders/new', label: '新建訂單' },
    ],
  },
  {
    href: '/worklogs',
    label: '工時紀錄'
  },
  {
    href: '/ai-recipe-generator',
    label: '工具',
    children: [
      { href: '/recipe-library', label: '配方庫', icon: 'Library' },
      { href: '/ai-recipe-generator', label: 'AI 配方生成器', icon: 'Sparkles' },
      { href: '/granulation-analyzer', label: '製粒分析工具', icon: 'FlaskConical' },
      { href: '/marketing-assistant', label: '行銷設計助手', icon: 'Palette' }
    ],
  },
]

const LOGOUT_LINK: NavigationLink = { href: '/login?logout=true', label: '登出' }

export function getMainNavigationLinks(options: NavigationOptions = {}): NavigationLink[] {
  const { includeLogout = true, isAdmin = false } = options
  const links = [...BASE_NAVIGATION_LINKS]

  // Add admin link for admins
  if (isAdmin) {
    links.push({ href: '/admin', label: '系統管理' })
  }

  if (includeLogout) {
    links.push(LOGOUT_LINK)
  }

  return links
}

export const MAIN_NAVIGATION_LINKS = getMainNavigationLinks()

// Footer sections interface
export interface FooterSection {
  title: string
  links: FooterLink[]
}

export interface FooterLink {
  href: string
  label: string
  isExternal?: boolean
}

// Footer sections data
export function getFooterSections(): FooterSection[] {
  return [
    {
      title: '訂單管理',
      links: [
        { href: '/orders', label: '訂單列表' },
        { href: '/orders/new', label: '新建訂單' }
      ]
    },
    {
      title: '工具',
      links: [
        { href: '/recipe-library', label: '配方庫' },
        { href: '/ai-recipe-generator', label: 'AI 配方生成器' },
        { href: '/granulation-analyzer', label: '製粒分析工具' },
        { href: '/marketing-assistant', label: '行銷設計助手' }
      ]
    },
    {
      title: '資源中心',
      links: [
        { href: '/pdf/膠囊生產培訓手冊（香港版-修訂版）.pdf', label: '膠囊生產培訓手冊', isExternal: true },
        { href: '/pdf/保健品行業常見生產風險原料清單.pdf', label: '風險原料清單', isExternal: true },
        { href: '/history', label: '版本歷史' }
      ]
    },
    {
      title: '系統',
      links: [
        { href: '/', label: '首頁' },
        { href: '/worklogs', label: '工時紀錄' },
        { href: '/privacy', label: '隱私政策' },
        { href: '/terms', label: '服務條款' }
      ]
    }
  ]
}

