# 行銷設計助手 - 使用指南

## 概述

全新的「行銷設計助手」頁面已成功建立，專為膠囊產品提供完整的行銷策略分析與包裝設計方案。

## 功能特色

### 1. 配方輸入
- **智能導入**：支援文字和圖片自動識別配方
- **簡化欄位**：只需輸入原料名稱和單粒重量 (mg)
- **批次管理**：可新增/刪除多個原料項目

### 2. AI 行銷策略分析 (GPT-5 Pro)
使用 `openai/gpt-5-pro` 模型生成專業行銷建議，包括：

#### 輸出內容結構
- **產品功效定位**：分析配方功效，確定核心賣點
- **合規宣傳建議**：3-5 條符合香港法規的宣傳語
- **行銷渠道策略**：社交媒體、電商平台、實體店等
- **內容行銷方案**：短影片腳本、FAQ 懶人包、部落格主題
- **SEO 關鍵字策略**：10-15 個香港繁體中文關鍵字
- **包裝設計方案**：
  - 視覺風格建議
  - 主色系建議（依功效對應）
  - 標籤版面內容規劃
  - USP 徽章建議
- **圖像生成 Prompt**：3 組詳細的英文 Prompt
  - 實拍瓶身
  - 生活情境
  - 平鋪俯拍
- **行動呼籲（CTA）建議**

#### 合規要求
- ✅ 只使用「支持」「有助於」等詞彙
- ✅ 必須附註「此產品並非藥物」聲明
- ❌ 不得使用治療性宣稱
- ❌ 避免療效承諾

### 3. 圖像 Prompt 提取器
- 自動從分析結果中提取圖像生成提示詞
- 分類顯示（實拍瓶身、情境、平鋪）
- 一鍵複製功能

### 4. AI 包裝圖像生成 (Gemini 2.5 Flash Image)
使用 `google/gemini-2.5-flash-image-preview` 模型生成產品包裝視覺：

- **輸入方式**：手動輸入或貼上提取的 Prompt
- **輸出規格**：1024x1024px 專業產品攝影
- **功能**：即時預覽、一鍵下載

### 5. 包裝設計圖紙生成器
本地生成可編輯的 SVG 標籤設計藍圖：

#### 設計規格
- **標籤尺寸**：140mm × 60mm
- **出血區域**：2mm（紅色虛線標示）
- **安全區域**：3mm（綠色虛線標示）

#### 版面內容
- 頂部：品牌名稱 + 粒數
- 中部：產品名稱 + 功效標語
- 成分區：主要成分與含量（前 3-5 項）
- 使用方法：每日建議劑量
- 警示語：「此產品並非藥物」等合規聲明
- 底部：淨含量、產地、QR 碼追溯、回收標誌

#### 下載格式
- **SVG**：可使用 Adobe Illustrator 或 Inkscape 編輯
- **PNG**：高解析度圖像（3x resolution）

## 技術實作

### 前端架構
```
/src/app/marketing-assistant/page.tsx         # 主頁面
/src/components/marketing/
  ├── marketing-input.tsx                      # 配方輸入元件
  ├── marketing-analysis.tsx                   # 分析結果顯示
  ├── prompt-viewer.tsx                        # Prompt 提取與顯示
  ├── image-generator.tsx                      # AI 圖像生成器
  └── blueprint-generator.tsx                  # SVG 設計圖紙生成器
```

### 後端 API
```
/src/app/api/ai/marketing-analyze/route.ts    # SSE 串流分析 (GPT-5 Pro)
/src/app/api/ai/packaging-image/route.ts      # 圖像生成 (Gemini 2.5 Flash)
```

### AI 模型配置
- **行銷分析**：`openai/gpt-5-pro`
  - 最大 Token：16,000
  - Temperature：0.7
  - 串流輸出（SSE）
- **圖像生成**：`google/gemini-2.5-flash-image-preview`
  - 尺寸：1024x1024px
  - 專業產品攝影風格

### 導航整合
已更新 `/src/data/navigation.ts`，新增「行銷設計助手」至工具選單。

## 使用流程

1. **輸入配方**
   - 使用智能導入或手動輸入原料與重量
   - 確保至少有一項有效原料

2. **開始分析**
   - 點擊「開始行銷分析」按鈕
   - 等待 GPT-5 Pro 生成完整策略（通常 10-30 秒）

3. **查看分析結果**
   - 閱讀詳細的行銷策略與包裝建議
   - 使用「複製」按鈕儲存內容

4. **提取圖像 Prompt**
   - 系統自動提取 3 組 Prompt
   - 可直接複製使用

5. **生成包裝圖像**
   - 貼上或修改 Prompt
   - 點擊「生成包裝圖像」
   - 預覽並下載結果

6. **生成設計圖紙**
   - 點擊「生成設計圖紙」
   - 預覽 SVG 藍圖
   - 下載 SVG 或 PNG 格式

## 相容性更新

### 製粒分析工具同步更新
已同步更新 `/src/app/granulation-analyzer/page.tsx`：
- ✅ 移除「客戶提供」欄位
- ✅ 簡化為只顯示原料名稱和重量
- ✅ 統一刪除按鈕樣式（使用 Trash2 圖示）

## 環境變數

確保以下環境變數已設定：
```bash
OPENROUTER_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 注意事項

### 合規性
- 所有文案遵循香港保健品法規
- 避免醫療聲稱和療效承諾
- 必須包含「此產品並非藥物」聲明

### 圖像生成
- Gemini 2.5 Flash Image 模型回應格式可能隨 API 更新而變化
- 建議定期檢查圖像 URL 提取邏輯（`packaging-image/route.ts` 第 59-60 行）

### SVG 編輯
- 生成的 SVG 包含參考線（出血、安全區）
- 可使用專業軟體編輯後導出生產用檔案
- 顏色方案可通過修改 `colorScheme` prop 自訂

## 未來擴充建議

1. **多語言支援**：新增英文/簡中輸出選項
2. **包裝模板**：預設多種瓶身尺寸模板
3. **批次生成**：一次生成多個設計變體
4. **A/B 測試**：對比不同文案效果
5. **社交媒體預覽**：直接生成 IG/FB 貼文樣式

## 技術規範

- ✅ 所有元件遵循 250 行上限
- ✅ 使用 TypeScript 嚴格模式
- ✅ 遵循 iOS 26 Liquid Glass 設計系統
- ✅ 實作 AbortController 取消機制
- ✅ 完整錯誤處理與 Toast 通知
- ✅ 響應式設計（mobile-first）
- ✅ 無障礙標籤（ARIA）

## 完成清單

- [x] 建立 marketing-assistant 頁與頁面框架
- [x] 新增 /api/ai/marketing-analyze SSE 端點（openai/gpt-5-pro）
- [x] 新增 /api/ai/packaging-image 端點（gemini-2.5-flash-image-preview）
- [x] 實作 MarketingAnalysis 區塊（Markdown 流、複製、錯誤）
- [x] 實作 PromptViewer（抽取/顯示/複製三類 Prompt）
- [x] 實作 ImageGenerator（選視角→生成→預覽→下載）
- [x] 實作 Blueprint SVG 產生器與下載
- [x] 文案/合規優化、錯誤處理、空狀態與可取消
- [x] 更新導航選單
- [x] 同步更新製粒分析頁（移除客戶提供欄位）

---

**立即體驗**: 訪問 `/marketing-assistant` 開始使用全新的行銷設計助手！

