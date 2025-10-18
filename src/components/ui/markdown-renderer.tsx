import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
  whiteText?: boolean
}

export function MarkdownRenderer({ content, className = '', whiteText = false }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定義標題樣式
          h1: ({ children }) => (
            <h1 className={`text-lg font-bold mb-2 mt-4 first:mt-0 ${whiteText ? 'text-white' : 'text-neutral-900'}`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={`text-base font-semibold mb-2 mt-3 first:mt-0 ${whiteText ? 'text-white' : 'text-neutral-900'}`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-sm font-medium mb-1 mt-2 first:mt-0 ${whiteText ? 'text-white' : 'text-neutral-900'}`}>
              {children}
            </h3>
          ),
          // 自定義段落樣式
          p: ({ children }) => (
            <p className={`text-sm mb-2 leading-relaxed ${whiteText ? 'text-white' : 'text-neutral-700'}`}>
              {children}
            </p>
          ),
          // 自定義列表樣式
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className={`text-sm ${whiteText ? 'text-white' : 'text-neutral-700'}`}>
              {children}
            </li>
          ),
          // 自定義強調樣式
          strong: ({ children }) => (
            <strong className={`font-semibold ${whiteText ? 'text-white' : 'text-neutral-900'}`}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className={`italic ${whiteText ? 'text-white' : 'text-neutral-800'}`}>
              {children}
            </em>
          ),
          // 自定義代碼樣式
          code: ({ children }) => (
            <code className={`px-1 py-0.5 rounded text-xs font-mono ${whiteText ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-800'}`}>
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className={`p-2 rounded text-xs font-mono overflow-x-auto mb-2 ${whiteText ? 'bg-white/20 text-white' : 'bg-neutral-100'}`}>
              {children}
            </pre>
          ),
          // 自定義引用樣式
          blockquote: ({ children }) => (
            <blockquote className={`border-l-4 pl-3 py-1 mb-2 rounded-r ${whiteText ? 'border-white/40 bg-white/10' : 'border-primary-200 bg-primary-50'}`}>
              {children}
            </blockquote>
          ),
          // 自定義表格樣式
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-neutral-200 rounded">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-neutral-50">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-neutral-200">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-neutral-50">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-sm text-neutral-900">
              {children}
            </td>
          ),
          // 自定義分隔線
          hr: () => (
            <hr className="border-neutral-200 my-3" />
          ),
          // 自定義鏈接樣式
          a: ({ children, href }) => (
            <a 
              href={href} 
              className={`hover:underline ${whiteText ? 'text-primary-300 hover:text-primary-200' : 'text-primary-600'}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
