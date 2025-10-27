import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
  whiteText?: boolean
}

export function MarkdownRenderer({ content, className = '', whiteText = false }: MarkdownRendererProps) {
  // Generate ID from text content
  const generateId = (children: any): string => {
    const text = typeof children === 'string' ? children : 
      Array.isArray(children) ? children.join('') : 
      children?.toString() || ''
    return text.replace(/[^\w\s]/g, '').replace(/\s+/g, '-').toLowerCase()
  }

  return (
    <div className={`prose prose-sm max-w-none prose-neutral dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定義標題樣式
          h1: ({ children }) => (
            <h1 className={`text-lg font-bold mb-2 mt-4 first:mt-0 ${whiteText ? 'text-white' : 'text-neutral-900 dark:text-white/95'}`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const id = `section-${generateId(children)}`
            return (
              <h2 
                id={id}
                className={`text-base font-semibold mb-3 mt-6 first:mt-0 pb-2 border-b border-neutral-200 scroll-mt-20 ${whiteText ? 'text-white border-white/20' : 'text-neutral-900 dark:text-white/95'}`}
              >
                {children}
              </h2>
            )
          },
          h3: ({ children }) => (
            <h3 className={`text-sm font-medium mb-2 mt-4 first:mt-0 ${whiteText ? 'text-white' : 'text-neutral-900 dark:text-white/95'}`}>
              {children}
            </h3>
          ),
          // 自定義段落樣式
          p: ({ children }) => (
            <p className={`text-sm mb-2 leading-relaxed ${whiteText ? 'text-white' : 'text-neutral-700 dark:text-white/85'}`}>
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
            <li className={`text-sm ${whiteText ? 'text-white' : 'text-neutral-700 dark:text-white/85'}`}>
              {children}
            </li>
          ),
          // 自定義強調樣式
          strong: ({ children }) => (
            <strong className={`font-semibold ${whiteText ? 'text-white' : 'text-neutral-900 dark:text-white/95'}`}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className={`italic ${whiteText ? 'text-white' : 'text-neutral-800 dark:text-white/95'}`}>
              {children}
            </em>
          ),
          // 自定義代碼樣式
          code: ({ children }) => (
            <code className={`px-1 py-0.5 rounded text-xs font-mono ${whiteText ? 'bg-white/20 text-white' : 'bg-surface-primary text-neutral-800 dark:text-white/95'}`}>
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className={`p-2 rounded text-xs font-mono overflow-x-auto mb-2 ${whiteText ? 'bg-white/20 text-white' : 'bg-surface-primary dark:bg-neutral-800/30 text-neutral-900 dark:text-white/95'}`}>
              {children}
            </pre>
          ),
          // 自定義引用樣式
          blockquote: ({ children }) => (
            <blockquote className={`border-l-4 pl-3 py-1 mb-2 rounded-r ${whiteText ? 'border-white/40 bg-white/10' : 'border-primary-200 dark:border-primary-800/30 bg-primary-50 dark:bg-primary-900/20'}`}>
              {children}
            </blockquote>
          ),
          // 自定義表格樣式
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-neutral-100 dark:bg-elevation-1">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-neutral-200 bg-surface-primary dark:bg-elevation-1">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-neutral-50 dark:hover:bg-elevation-2 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-white/85 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-neutral-900 dark:text-white/95">
              {children}
            </td>
          ),
          // 自定義分隔線
          hr: () => (
            <hr className="border-neutral-200 dark:border-neutral-700 my-3" />
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
