import { AlertTriangle, Shield, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface AIDisclaimerProps {
  type?: 'recipe' | 'analysis' | 'general'
  className?: string
}

export function AIDisclaimer({ type = 'recipe', className = '' }: AIDisclaimerProps) {
  const getDisclaimerContent = () => {
    switch (type) {
      case 'recipe':
        return {
          title: 'AI 生成配方免責聲明',
          content: [
            '本配方由人工智能生成，僅供參考和研究用途。',
            '配方未經臨床試驗驗證，不構成醫療建議或治療方案。',
            '使用前請諮詢專業醫師或營養師，確保安全性和適用性。',
            '生產商需自行承擔所有法律責任和合規義務。',
            '建議進行完整的產品測試和法規審查。'
          ]
        }
      case 'analysis':
        return {
          title: 'AI 分析結果免責聲明',
          content: [
            '本分析結果由人工智能生成，僅供參考。',
            '數據來源和準確性未經獨立驗證。',
            '投資和商業決策請基於專業評估。',
            '建議諮詢相關專業人士獲取準確信息。'
          ]
        }
      default:
        return {
          title: 'AI 生成內容免責聲明',
          content: [
            '本內容由人工智能生成，僅供參考。',
            '請自行驗證信息的準確性和適用性。',
            '重要決策請諮詢專業人士。'
          ]
        }
    }
  }

  const { title, content } = getDisclaimerContent()

  return (
    <Card className={`bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/30 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-warning-100 dark:bg-warning-800/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-warning-800 dark:text-warning-200 mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              {title}
            </h4>
            <ul className="text-xs text-warning-700 dark:text-warning-300 space-y-1">
              {content.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-warning-500 dark:text-warning-400 mr-2 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-warning-200 dark:border-warning-800/30">
              <div className="flex items-center text-xs text-warning-600 dark:text-warning-400">
                <FileText className="h-3 w-3 mr-1" />
                <span>使用本系統即表示您已閱讀並同意上述免責聲明</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 緊湊版免責條款
export function AIDisclaimerCompact({ className = '' }: { className?: string }) {
  return (
    <Card className={`bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800/30 ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-warning-600 dark:text-warning-400 flex-shrink-0" />
          <span className="text-xs text-warning-700 dark:text-warning-300">
            <strong>免責聲明：</strong>本內容由 AI 生成，僅供參考。請諮詢專業人士。
          </span>
        </div>
      </CardContent>
    </Card>
  )
}