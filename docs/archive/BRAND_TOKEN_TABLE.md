# 品牌設計 Token 表

本表整理目前於 `src/app/globals.css` 定義的品牌設計 token，方便設計師與工程團隊共用與維護。

## 顏色 Color Tokens

| Token 名稱 | CSS 變數 | 值 | 用途說明 |
| --- | --- | --- | --- |
| 品牌主色 | `--brand-primary` | `202 88% 42%` | 主要行動按鈕、重點強調 |
| 品牌次色 | `--brand-secondary` | `187 60% 70%` | 次要行動、資訊區塊背景 |
| 品牌襯色 | `--brand-accent` | `224 35% 65%` | 十分突出的提示、指示元素 |
| 品牌中性色 | `--brand-neutral` | `215 48% 18%` | 文字主色、深色背景文字 |
| 全局背景 | `--background` | `204 100% 99%` | 頁面淺色背景 |
| 全局文字 | `--foreground` | `215 48% 18%` | 一般文字 |
| 危險狀態 | `--destructive` | `0 76% 58%` | 錯誤警示、刪除動作 |
| 危險文字 | `--destructive-foreground` | `0 0% 100%` | 錯誤相關文字 |

## 玻璃擬態 Tokens

| Token 名稱 | CSS 變數 | 值 | 用途說明 |
| --- | --- | --- | --- |
| Glass 透明度 | `--glass-opacity` | `0.12` | Liquid Glass 元件背景透明度 |
| Glass 邊框透明度 | `--glass-border-opacity` | `0.2` | Liquid Glass 邊框透明度 |
| Glass Hover 透明度 | `--glass-hover-opacity` | `0.16` | hover 狀態透明度 |
| Glass 強烈模糊 | `--brand-blur-strong` | `28px` | 導覽列、Modal 背景模糊 |
| Glass 中度模糊 | `--brand-blur-medium` | `18px` | 卡片與內容容器背景 |
| Glass 柔和模糊 | `--brand-blur-soft` | `12px` | 浮動按鈕、圖示背景 |

## 陰影與光暈 Tokens

| Token 名稱 | CSS 變數 | 值 | 用途說明 |
| --- | --- | --- | --- |
| 主陰影 | `--brand-shadow-soft` | `0 18px 46px rgba(34, 86, 122, 0.18)` | 卡片 hover 陰影 |
| 中陰影 | `--brand-shadow-medium` | `0 12px 32px rgba(31, 78, 112, 0.16)` | 浮動元件陰影 |
| 內陰影 | `--brand-shadow-inner` | `inset 0 1px 0 rgba(255, 255, 255, 0.5)` | Glass 元件頂部高光 |
| 品牌漸層 | `--brand-gradient-primary` | `linear-gradient(135deg, rgba(42, 150, 209, 0.9), rgba(32, 105, 157, 0.85))` | 品牌卡片、圖示背景 |

## 排版 Tokens

| Token 名稱 | CSS 變數 | 值 | 用途說明 |
| --- | --- | --- | --- |
| Display 字體 | `--font-brand-display` | `"SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif` | 大標題與 Hero 區塊 |
| Body 字體 | `--font-brand-text` | `"SF Pro Text", "Helvetica Neue", Arial, sans-serif` | 內文、描述文字 |

## 使用建議

- 優先以 CSS 變數（如 `var(--brand-primary)`）呼叫 token，確保修改時全站同步。
- 新增組件時，參考 Liquid Glass 組件使用的陰影與模糊設定，保持 iOS Liquid Glass 效果。
- Figma 亦可同名建立設計 token，提升交接效率。
- 若需新增 token，先補充至 `globals.css` 再更新本文檔，保持設計資產一致。

