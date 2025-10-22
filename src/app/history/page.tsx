'use client'

import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import Link from 'next/link'

export default function HistoryPage() {
  const versionHistory = [
    {
      version: 'v2.7.0',
      date: '2025年10月23日',
      type: '重大更新',
      typeColor: 'bg-warning-100 text-orange-800 border-orange-200',
      features: [
        '🔐 全新 OTP 電話驗證系統上線，使用 Twilio 提供的 SMS 驗證碼登入，取代原有的共享密碼登入方式',
        '📱 設備信任功能，勾選「信任此設備30天」後，同一設備可在30天內免輸入驗證碼自動登入（一般員工）',
        '👥 三級角色權限管理，支援員工/經理/管理員權限，管理員和經理享有永久登入（自動續期30天）',
        '🛡️ 完整審計日誌系統，記錄所有用戶操作（訂單創建/修改、配方操作、工時記錄、AI 互動），管理員可按用戶查詢',
        '⚙️ 系統管理後台，管理員可新增用戶、分配角色、撤銷設備信任、查看活動會話與審計日誌，支援單用戶過濾',
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
      typeColor: 'bg-primary-100 text-primary-800 border-primary-200',
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
      typeColor: 'bg-warning-100 text-orange-800 border-orange-200',
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
      typeColor: 'bg-warning-100 text-orange-800 border-orange-200',
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
      typeColor: 'bg-green-100 text-green-800 border-green-200',
      features: [
        '📱 全面優化手機與平板瀏覽體驗，文字大小自動適配不同螢幕尺寸，閱讀更舒適',
        '✨ 提升所有按鈕和輸入框的觸控區域至 44x44 像素，符合無障礙標準，手機操作更流暢',
        '📊 改進訂單詳情與表單的卡片佈局，手機瀏覽訂單和配方資料更清晰易讀',
        '🎯 優化表格橫向滾動體驗，加入平滑滾動條，桌面與手機都能輕鬆查看完整資料',
        '🎨 建立完整 Cursor AI 開發規則系統，確保未來代碼品質與設計一致性'
      ]
    },
    {
      version: 'v2.2.3',
      date: '2025年10月9日',
      type: '功能更新',
      typeColor: 'bg-primary-100 text-primary-800 border-primary-200',
      features: [
        '首頁新增參考資料下載區塊，提供生產培訓手冊與風險原料清單 PDF 下載',
        '優化首頁訂單排序邏輯，優先顯示進行中訂單以改善日常工作流程',
        '移除未完成的 RSS 新聞功能，確保系統穩定性與部署效率'
      ]
    },
    {
      version: 'v2.2.2',
      date: '2025年10月5日',
      type: '功能更新',
      typeColor: 'bg-primary-100 text-primary-800 border-primary-200',
      features: [
        '首頁重構為四大重點模塊，新增工具導覽與最新更新摘要',
        '導航列、模態與 Toast 全面符合 WCAG 2.1 AA，支援鍵盤焦點與動態減敏',
        'API 錯誤提示、載入狀態與 aria-live 統一，強化跨頁使用體驗'
      ]
    },
    {
      version: 'v2.2.1',
      date: '2025年10月2日',
      type: '功能更新',
      typeColor: 'bg-primary-100 text-primary-800 border-primary-200',
      features: [
        'Grok AI 回歸製粒分析，回應更自然貼地',
        '訂單 AI 助手 Modal 疊層再進化，所有裝置都能穩定顯示',
        '新增隱私政策與服務條款頁面，Footer 連結立即可用',
        'Footer 版權年份更新至 2025，細節同步最新狀態'
      ]
    },
    {
      version: 'v2.2.0',
      date: '2025年10月1日',
      type: '功能更新',
      typeColor: 'bg-primary-100 text-primary-800 border-primary-200',
      features: [
        'AI 助手 Modal 玻璃化改版，新增手機折疊資訊晶片',
        'PDF 下載區改用 Liquid Glass 卡片，桌面排列一致',
        '導航列最大寬度調整，超寬螢幕仍保持左右留白',
        '登入頁整合 Liquid Glass 風格與品牌提示'
      ]
    },
    {
      version: 'v2.0.0',
      date: '2025年9月29日',
      type: '功能更新',
      typeColor: 'bg-primary-100 text-primary-800 border-primary-200',
      features: [
        '全站換上品牌背景動畫與 Liquid Glass 卡片',
        'AI 助手布局統一，新增建議提問及複製操作',
        'PDF 參考資料中心上線，提供風險清單及培訓手冊',
        '導航與 Footer 導入共用設定檔，移除舊頁面連結'
      ]
    },
    {
      version: 'v1.0.8',
      date: '2025年9月28日',
      type: '穩定版本',
      typeColor: 'bg-primary-100 text-primary-800 border-primary-200',
      features: [
        'AI 助手功能全面優化，移除 reasoning 參數提升性能',
        '新增用戶可選的深度推理模式，平衡速度與質量',
        '添加 AI 免責條款，提升用戶透明度和法律合規性'
      ]
    },
    {
      version: 'v1.0.7',
      date: '2025年9月27日',
      type: '穩定版本',
      typeColor: 'bg-primary-100 text-primary-800 border-primary-200',
      features: [
        '全新玻璃質感介面設計',
        '修復系統部署和穩定性問題',
        '優化 AI 助手功能'
      ]
    },
    {
      version: 'v1.0.6',
      date: '2025年9月25日',
      type: '功能更新',
      typeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      features: [
        '新增訂單搜尋和篩選功能',
        '優化數據庫查詢性能',
        '改進用戶界面響應速度'
      ]
    },
    {
      version: 'v1.0.5',
      date: '2025年9月22日',
      type: '功能更新',
      typeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      features: [
        '新增膠囊顏色選擇功能',
        '優化配方計算邏輯',
        '改進訂單管理界面'
      ]
    },
    {
      version: 'v1.0.0',
      date: '2025年9月10日',
      type: '初始版本',
      typeColor: 'bg-gray-100 text-neutral-800 border-neutral-200',
      features: [
        '系統基礎架構建立',
        '用戶認證系統',
        '訂單創建功能',
        '基本數據管理'
      ]
    }
  ]

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      
      {/* Main Content with padding for fixed nav */}
      <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-8 floating-combined">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回首頁
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-2xl font-bold text-neutral-800">
              版本更新歷史
            </h1>
          </div>
          <p className="text-neutral-600 text-sm sm:text-sm">
            Easy Health 膠囊管理系統的完整更新記錄
          </p>
        </div>

        {/* Version History */}
        <div className="space-y-6">
          {versionHistory.map((version, index) => (
            <div key={version.version} className="liquid-glass-card liquid-glass-card-elevated liquid-glass-card-interactive">
              <div className="liquid-glass-content">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="icon-container icon-container-blue">
                      <Tag className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-800">
                        {version.version}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-neutral-500" />
                        <span className="text-sm text-neutral-600">{version.date}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${version.typeColor}`}>
                    {version.type}
                  </span>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-neutral-700">更新內容：</h4>
                  <ul className="space-y-2">
                    {version.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <span className="text-primary-500 mt-1.5 flex-shrink-0">•</span>
                        <span className="text-sm text-neutral-600 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-neutral-500 text-sm">
            感謝您使用 Easy Health 膠囊管理系統
          </p>
          <p className="text-neutral-400 text-xs mt-2">
            如有任何問題或建議，請聯繫技術支援團隊
          </p>
        </div>
      </div>

      <LiquidGlassFooter />
    </div>
  )
}

