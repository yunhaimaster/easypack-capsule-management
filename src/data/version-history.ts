/**
 * Version History - Single Source of Truth
 * 
 * This module contains all version information for the Easy Health system.
 * Used by: Homepage update card, History page, Navigation badges, Toast notifications
 * 
 * To release a new version:
 * 1. Update CURRENT_VERSION
 * 2. Add new version to VERSION_HISTORY array
 * 3. System automatically resets all notifications
 */

export interface VersionInfo {
  version: string // e.g., "v2.8.0"
  date: string // Chinese date format
  type: string // Update category
  typeColor: string // Tailwind classes for badge
  features: string[] // Feature list with emojis
  releaseDate: Date // For version comparisons
  critical?: boolean // Force show update (for critical security patches)
}

export const CURRENT_VERSION: VersionInfo = {
  version: 'v3.0.0',
  date: '2025年1月29日',
  type: '重大更新',
  typeColor: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400 border-orange-200 dark:border-warning-800',
  releaseDate: new Date('2025-01-29'),
  features: [
    '📅 經理排單表全面上線 — 專業的生產排程管理系統，經理可拖曳調整工作單優先順序，即時追蹤膠囊生產進度。一覽式表格設計，所有關鍵資訊（次序、客戶名稱、產品名稱、預期生產時間、製程問題、品質備註）一目了然，大幅提升生產排程效率',
    '🔗 工作單與膠囊訂單智能串連 — 實現工作單與膠囊生產訂單的 1:1 連結，從工作單頁面可直接創建對應的膠囊訂單並自動關聯。雙向數據同步確保製程問題、品質備註等資訊在兩個系統間即時更新，避免資料不一致',
    '✨ 快速創建生產訂單流程 — 在排單表中一鍵從工作單創建膠囊訂單，系統自動填入所有相關資料（客戶名稱、產品名稱、原料資訊），減少重複輸入。未連結訂單的工作單會顯示醒目提醒，確保每個工作單都對應到實際生產訂單',
    '📋 排單表深度整合優化 — 擴展檢視功能讓您無需離開排單表即可查看完整工作單詳情。展開/收起全部、快速操作選單、匯出功能等貼心設計，讓經理排程工作更流暢',
    '🔐 權限管理精緻化 — 排單表支援分級權限：所有使用者可查看排單表掌握生產狀態，僅經理和管理員可編輯、拖曳排序、刪除項目，確保排程權限的精準控制'
  ]
}

export const VERSION_HISTORY: VersionInfo[] = [
  CURRENT_VERSION,
  {
    version: 'v2.8.0',
    date: '2025年10月28日',
    type: '架構重組',
    typeColor: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 border-primary-200 dark:border-primary-800',
    releaseDate: new Date('2025-10-28'),
    features: [
      '🏢 統一工作單系統上線 — 全新工作單架構支援生產、包裝、倉務等多類型工作管理，膠囊訂單整合為工作單子系統，為未來擴展奠定基礎。系統定位從單一膠囊生產升級為全方位工作管理平台',
      '🎯 導航架構全面重組 — 「訂單管理」升級為「工作單管理」主選單，清晰展示「工作單列表」、「膠囊訂單」、「新增膠囊訂單」等入口，資訊層級更分明，使用者更容易找到目標功能',
      '📊 首頁營運中樞改版 — 從「膠囊生產營運中樞」轉型為「工作單營運中樞」，核心功能卡片重新排序：工作單總覽優先、膠囊訂單次之、工時記錄輔助，反映新的業務優先級',
      '🔄 向下相容 100% 保證 — 所有現有膠囊訂單功能完全保留，URL 路徑維持不變（/orders、/orders/new、/orders/[id]），資料庫架構零變動，業務流程零中斷，使用者無感升級',
      '✨ iOS App Store 風格更新日誌 — 版本歷史頁面採用 Apple 官方設計語言，粗體標題、破折號間隔、詳細說明，讓每次更新的價值一目了然，提升閱讀體驗',
      '🎨 介面文案全面更新 — 所有頁面標題、按鈕、導航列文字統一調整為「膠囊訂單」用語，與新架構保持一致，避免混淆，提升系統專業度'
    ]
  },
  {
    version: 'v2.7.0',
    date: '2025年10月23日',
    type: '重大更新',
    typeColor: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400 border-orange-200 dark:border-warning-800',
    releaseDate: new Date('2025-10-23'),
    features: [
      '🔐 全新 OTP 電話驗證系統上線，使用 Twilio 提供的 SMS 驗證碼登入，取代原有的共享密碼登入方式',
      '📱 設備信任功能，勾選「信任此設備30天」後，同一設備可在30天內免輸入驗證碼自動登入',
      '🎨 豆包 SeeDream 4.0 AI 圖片生成，全面升級產品包裝設計、標籤設計與 2K 高清海報（3520x4704 像素）',
      '🏙️ 香港製造專屬風格，AI 動態生成香港地標背景（中環摩天大樓、維港夜景、太平山頂），突出本地品牌形象',
      '💾 AI 內容自動保存，圖片生成的所有內容（分析、Prompt、圖片 URL）自動保存到 localStorage，重新整理不會遺失',
      '✏️ Prompt 即時編輯，生成圖片後可直接修改 Prompt 並重新生成，支援快速調整設計細節',
      '⚡ Next.js 15 + React 19 升級，全面採用最新框架版本，支援流式渲染（Streaming）與樂觀更新（Optimistic Updates）',
      '📊 效能全面優化，實施 AI 模型參數最佳化策略，針對不同任務類型（創意/分析/互動）使用不同的 temperature 與 token 限制',
      '🏗️ 模組化架構重構，所有 API 路由改用黑盒架構模式，每個模組可獨立測試和替換，提升代碼可維護性',
      '🐛 電話號碼驗證改進，支援香港 8 位數字自動加 +852，移除所有隱藏 Unicode 字符（零寬空格、BOM、方向標記等）',
      '📋 智能導入審核，配方庫圖片批量上傳支援多圖解析，AI 自動識別配方名稱、原料與含量，導入前可審核編輯',
      '🔍 配方庫原料搜尋，可按原料名稱篩選配方（如搜尋「鈣」找出所有含鈣配方），支援進階多條件組合篩選'
    ]
  },
  {
    version: 'v2.6.0',
    date: '2025年10月20日',
    type: '功能優化',
    typeColor: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 border-primary-200 dark:border-primary-800',
    releaseDate: new Date('2025-10-20'),
    features: [
      '🔍 智能導入全面優化，新增「審查後應用」流程，導入配方前可檢視、編輯原料名稱與劑量，避免錯誤資料寫入',
      '⚡ 配方搜索功能升級，新增原料名稱搜索，可依原料快速篩選配方（例如：搜尋「鈣」找出所有含鈣的配方）',
      '🎯 進階篩選全面增強，配方庫支援功效類別多選、原料篩選、日期範圍、快速標籤等多維度搜索組合',
      '📊 快速篩選標籤，新增「最近生產」、「熱門配方」、「高劑量維生素C」等常用快速篩選按鈕，一鍵切換',
      '✨ 建立完整測試框架，整合 Jest 單元測試和 Playwright E2E 測試，確保代碼品質與功能穩定性',
      '📈 監控系統正式上線，整合 Vercel Analytics 性能監控與事件追蹤，持續優化使用者體驗',
      '🐛 修復原料搜索 Bug，解決搜索結果不正確的問題，確保所有篩選條件正確組合查詢'
    ]
  },
  {
    version: 'v2.5.0',
    date: '2025年10月17日',
    type: '重大更新',
    typeColor: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400 border-orange-200 dark:border-warning-800',
    releaseDate: new Date('2025-10-17'),
    features: [
      '🏷️ 模板配方系統上線，配方庫現在區分「生產配方」和「模板配方」，可以批量導入參考配方而不影響實際生產記錄',
      '🤖 AI 智能解析功能，支援文字輸入或圖片上傳，AI 自動識別配方原料與劑量，大幅加快配方建檔速度',
      '📑 分類瀏覽升級，用 Tab 切換查看生產配方和模板配方，各自獨立搜尋和統計',
      '✨ 全站視覺統一，所有頁面配色和按鈕樣式完全一致，卡片設計更精緻，視覺層次更清晰',
      '👆 觸控體驗提升，所有按鈕加大到最適合手指點按的尺寸，動畫效果遵循 Apple 標準更流暢'
    ]
  },
  {
    version: 'v2.4.0',
    date: '2025年10月15日',
    type: '重大更新',
    typeColor: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400 border-orange-200 dark:border-warning-800',
    releaseDate: new Date('2025-10-15'),
    features: [
      '📚 配方庫正式上線，保存歷史訂單配方（含生產備註），AI 分析功效，一鍵匯出到行銷助手',
      '🔒 訂單配方密碼鎖上線，保護客戶指定原料配方，修改時需要 4 位數密碼驗證',
      '⏱️ 工時頁可直接新增工時記錄，不用再跳轉到訂單頁面',
      '🎨 介面全面優化，卡片佈局更清晰，按鈕觸控區域加大，視覺體驗提升',
      '🐛 修復多項已知問題，提升系統穩定性與操作流暢度'
    ]
  },
  {
    version: 'v2.2.4',
    date: '2025年10月13日',
    type: '體驗優化',
    typeColor: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400 border-green-200 dark:border-success-800',
    releaseDate: new Date('2025-10-13'),
    features: [
      '📱 全面優化手機與平板瀏覽體驗，文字大小自動適配不同螢幕尺寸，閱讀更舒適',
      '✨ 提升所有按鈕和輸入框的觸控區域至 44x44 像素，符合無障礙標準，手機操作更流暢',
      '📊 改進訂單詳情與表單的卡片佈局，手機瀏覽訂單和配方資料更清晰易讀',
      '🎯 優化表格橫向滾動體驗，加入平滑滾動條，桌面與手機都能輕鬆查看完整資料',
      '🎨 建立完整 Cursor AI 開發規則系統，確保未來代碼品質與設計一致性'
    ]
  }
]

/**
 * Parse version string to number array for comparison
 * @example parseVersion('v2.8.0') => [2, 8, 0]
 */
function parseVersion(version: string): number[] {
  return version.replace('v', '').split('.').map(Number)
}

/**
 * Compare two version strings using semver logic
 * @returns Positive if v1 > v2, Negative if v1 < v2, 0 if equal
 * @example compareVersions('v2.8.0', 'v2.7.0') => 1
 */
export function compareVersions(v1: string, v2: string): number {
  const [a1, b1, c1] = parseVersion(v1)
  const [a2, b2, c2] = parseVersion(v2)
  
  // Compare major.minor.patch in order
  return (a1 - a2) || (b1 - b2) || (c1 - c2)
}

/**
 * Check if current version is newer than stored version
 * @example isNewerVersion('v2.8.0', 'v2.7.0') => true
 */
export function isNewerVersion(current: string, stored: string): boolean {
  return compareVersions(current, stored) > 0
}

/**
 * Get version info by version string
 * @example getVersionInfo('v2.7.0') => VersionInfo
 */
export function getVersionInfo(version: string): VersionInfo | undefined {
  return VERSION_HISTORY.find(v => v.version === version)
}

