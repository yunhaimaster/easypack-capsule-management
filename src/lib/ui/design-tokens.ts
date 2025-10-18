/**
 * Apple HIG Design Tokens
 * 符合 Apple Human Interface Guidelines 的設計標準
 * 所有樣式通過這些 tokens 統一管理，實現一改全改
 */

// ============ 色彩系統 ============
// 語義化顏色，符合 Apple HIG 標準
export const colors = {
  // Primary - 品牌主色（藍色系）
  primary: {
    50: 'rgba(240, 249, 255, 1)',
    100: 'rgba(224, 242, 254, 1)',
    200: 'rgba(186, 230, 253, 1)',
    300: 'rgba(125, 211, 252, 1)',
    400: 'rgba(56, 189, 248, 1)',
    500: 'rgba(42, 150, 209, 1)',   // 主色
    600: 'rgba(32, 105, 157, 1)',
    700: 'rgba(24, 82, 128, 1)',
    800: 'rgba(18, 65, 102, 1)',
    900: 'rgba(12, 48, 76, 1)',
  },

  // Secondary - 輔助色（青色系）
  secondary: {
    50: 'rgba(236, 254, 255, 1)',
    100: 'rgba(207, 250, 254, 1)',
    200: 'rgba(165, 243, 252, 1)',
    300: 'rgba(103, 232, 249, 1)',
    400: 'rgba(34, 211, 238, 1)',
    500: 'rgba(68, 186, 198, 1)',   // 輔助色
    600: 'rgba(42, 150, 161, 1)',
    700: 'rgba(21, 128, 159, 1)',
    800: 'rgba(14, 116, 144, 1)',
    900: 'rgba(8, 95, 120, 1)',
  },

  // Success - 成功狀態（綠色系）
  success: {
    50: 'rgba(236, 253, 245, 1)',
    100: 'rgba(209, 250, 229, 1)',
    200: 'rgba(167, 243, 208, 1)',
    300: 'rgba(110, 231, 183, 1)',
    400: 'rgba(52, 211, 153, 1)',
    500: 'rgba(16, 185, 129, 1)',   // 成功色
    600: 'rgba(5, 150, 105, 1)',
    700: 'rgba(4, 120, 87, 1)',
    800: 'rgba(6, 95, 70, 1)',
    900: 'rgba(6, 78, 59, 1)',
  },

  // Warning - 警告狀態（橙色系）
  warning: {
    50: 'rgba(255, 251, 235, 1)',
    100: 'rgba(254, 243, 199, 1)',
    200: 'rgba(253, 230, 138, 1)',
    300: 'rgba(252, 211, 77, 1)',
    400: 'rgba(251, 191, 36, 1)',
    500: 'rgba(245, 158, 11, 1)',   // 警告色
    600: 'rgba(217, 119, 6, 1)',
    700: 'rgba(180, 83, 9, 1)',
    800: 'rgba(146, 64, 14, 1)',
    900: 'rgba(120, 53, 15, 1)',
  },

  // Danger - 危險狀態（紅色系）
  danger: {
    50: 'rgba(254, 242, 242, 1)',
    100: 'rgba(254, 226, 226, 1)',
    200: 'rgba(254, 202, 202, 1)',
    300: 'rgba(252, 165, 165, 1)',
    400: 'rgba(248, 113, 113, 1)',
    500: 'rgba(239, 68, 68, 1)',     // 危險色
    600: 'rgba(220, 38, 38, 1)',
    700: 'rgba(185, 28, 28, 1)',
    800: 'rgba(153, 27, 27, 1)',
    900: 'rgba(127, 29, 29, 1)',
  },

  // Info - 訊息狀態（紫色系）
  info: {
    50: 'rgba(245, 243, 255, 1)',
    100: 'rgba(237, 233, 254, 1)',
    200: 'rgba(221, 214, 254, 1)',
    300: 'rgba(196, 181, 253, 1)',
    400: 'rgba(167, 139, 250, 1)',
    500: 'rgba(139, 92, 246, 1)',    // 訊息色
    600: 'rgba(124, 58, 237, 1)',
    700: 'rgba(109, 40, 217, 1)',
    800: 'rgba(91, 33, 182, 1)',
    900: 'rgba(76, 29, 149, 1)',
  },

  // Neutral - 中性色（灰色系）
  neutral: {
    50: 'rgba(249, 250, 251, 1)',
    100: 'rgba(243, 244, 246, 1)',
    200: 'rgba(229, 231, 235, 1)',
    300: 'rgba(209, 213, 219, 1)',
    400: 'rgba(156, 163, 175, 1)',
    500: 'rgba(107, 114, 128, 1)',
    600: 'rgba(75, 85, 99, 1)',
    700: 'rgba(55, 65, 81, 1)',
    800: 'rgba(31, 41, 55, 1)',
    900: 'rgba(17, 24, 39, 1)',
  },
} as const

// ============ 間距系統 ============
// 基於 4pt 網格系統（Apple HIG 標準）
export const spacing = {
  0: '0',
  1: '4px',    // 4pt
  2: '8px',    // 8pt
  3: '12px',   // 12pt
  4: '16px',   // 16pt
  5: '20px',   // 20pt
  6: '24px',   // 24pt
  7: '28px',   // 28pt
  8: '32px',   // 32pt
  10: '40px',  // 40pt
  12: '48px',  // 48pt
  14: '56px',  // 56pt
  16: '64px',  // 64pt
  20: '80px',  // 80pt
  24: '96px',  // 96pt
} as const

// ============ 圓角系統 ============
// Apple 標準圓角半徑
export const borderRadius = {
  none: '0',
  sm: '8px',    // 小圓角（按鈕、Badge）
  md: '12px',   // 中圓角（卡片）
  lg: '16px',   // 大圓角（Modal）
  xl: '20px',   // 超大圓角（Hero）
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px', // 完全圓形
} as const

// ============ 陰影系統 ============
// Elevation levels（提升層級）
export const shadows = {
  none: 'none',
  // Level 1 - 輕微提升（懸停狀態）
  sm: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
  // Level 2 - 標準卡片
  md: '0 4px 16px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.08)',
  // Level 3 - 浮動元素
  lg: '0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.10)',
  // Level 4 - Modal/Dialog
  xl: '0 16px 48px rgba(0, 0, 0, 0.10), 0 8px 16px rgba(0, 0, 0, 0.12)',
  // Level 5 - 最高層級
  '2xl': '0 24px 64px rgba(0, 0, 0, 0.12), 0 12px 24px rgba(0, 0, 0, 0.14)',
  // 內陰影
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  // Glass 效果專用
  glass: '0 8px 32px rgba(31, 78, 112, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
} as const

// ============ 動畫系統 ============
// Apple 標準動畫時長和緩動函數
export const animation = {
  // Duration
  duration: {
    instant: '100ms',   // 即時反饋
    fast: '200ms',      // 快速過渡
    normal: '300ms',    // 標準過渡（Apple 標準）
    slow: '500ms',      // 慢速過渡
    slower: '700ms',    // 更慢
  },

  // Easing（Apple 推薦的緩動函數）
  easing: {
    // 標準緩動
    default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    // 進入動畫
    in: 'cubic-bezier(0.4, 0.0, 1, 1)',
    // 退出動畫
    out: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    // 進出動畫
    inOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    // Spring（iOS 風格彈簧動畫）
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const

// ============ 字體系統 ============
// SF Pro 字體家族（Apple 標準）
export const typography = {
  // Font families
  fontFamily: {
    display: '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    text: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Monaco", "Consolas", monospace',
  },

  // Font sizes (符合 Apple 文字大小規範)
  fontSize: {
    xs: '12px',      // 極小文字
    sm: '14px',      // 小文字
    base: '16px',    // 基礎大小
    lg: '18px',      // 大文字
    xl: '20px',      // 標題 5
    '2xl': '24px',   // 標題 4
    '3xl': '30px',   // 標題 3
    '4xl': '36px',   // 標題 2
    '5xl': '48px',   // 標題 1
    '6xl': '60px',   // Hero
  },

  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const

// ============ 模糊效果 ============
// Backdrop blur for glass effects
export const blur = {
  none: '0',
  sm: '4px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '40px',
  '3xl': '64px',
} as const

// ============ Z-index 系統 ============
// 統一管理層級，避免衝突
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const

// ============ 觸控目標 ============
// Apple HIG 最小觸控目標標準
export const touchTarget = {
  min: '44px',      // 最小觸控目標（Apple 標準）
  comfortable: '48px', // 舒適觸控目標
} as const

// ============ Breakpoints ============
// 響應式斷點
export const breakpoints = {
  sm: '640px',   // 手機橫屏
  md: '768px',   // 平板
  lg: '1024px',  // 桌面
  xl: '1280px',  // 大桌面
  '2xl': '1536px', // 超大桌面
} as const

// ============ 預設導出 ============
export const designTokens = {
  colors,
  spacing,
  borderRadius,
  shadows,
  animation,
  typography,
  blur,
  zIndex,
  touchTarget,
  breakpoints,
} as const

export default designTokens

