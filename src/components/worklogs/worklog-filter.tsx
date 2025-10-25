'use client'

import { useEffect, useState } from 'react'

import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface WorklogFilterProps {
  filters: {
    orderKeyword: string
    notesKeyword: string
    dateFrom: string
    dateTo: string
    page: number
    limit: number
  }
  onSearch: (filters: Partial<WorklogFilterProps['filters']>) => void
  onLimitChange: (limit: number) => void
  loading?: boolean
}

export function WorklogFilter({ filters, onSearch, onLimitChange, loading = false }: WorklogFilterProps) {
  const [orderKeyword, setOrderKeyword] = useState(filters.orderKeyword)
  const [notesKeyword, setNotesKeyword] = useState(filters.notesKeyword)
  const [dateFrom, setDateFrom] = useState(filters.dateFrom)
  const [dateTo, setDateTo] = useState(filters.dateTo)

  useEffect(() => {
    setOrderKeyword(filters.orderKeyword)
    setNotesKeyword(filters.notesKeyword)
    setDateFrom(filters.dateFrom)
    setDateTo(filters.dateTo)
  }, [filters])

  const limitOptions = [25, 50, 100]

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSearch({
      orderKeyword,
      notesKeyword,
      dateFrom,
      dateTo
    })
  }

  const handleClear = () => {
    setOrderKeyword('')
    setNotesKeyword('')
    setDateFrom('')
    setDateTo('')
    onSearch({ orderKeyword: '', notesKeyword: '', dateFrom: '', dateTo: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="liquid-glass-card liquid-glass-card-subtle p-6 relative">
      <div className="flex flex-col gap-4 mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-white/75 tracking-wide uppercase">工時篩選</h3>
            <p className="text-xs text-neutral-500 dark:text-white/55">快速搜尋訂單與備註，掌握最近工時紀錄</p>
          </div>
          <div className="flex items-center gap-2 sm:self-auto self-start">
            <span className="text-xs font-semibold text-neutral-600 dark:text-white/75">每頁顯示</span>
            <Select value={String(filters.limit)} onValueChange={(value) => onLimitChange(Number(value))}>
              <SelectTrigger className="w-[84px] h-7 border-none bg-transparent text-sm font-medium text-neutral-700 dark:text-white/75 focus:ring-0 focus:outline-none">
                <SelectValue placeholder="筆數" />
              </SelectTrigger>
              <SelectContent>
                {limitOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()} className="text-sm">
                    {option} 筆
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">訂單關鍵字</label>
          <div className="relative">
            <Input
              value={orderKeyword}
              onChange={(event) => setOrderKeyword(event.target.value)}
              placeholder="輸入客戶或產品關鍵字"
              className="pr-9"
            />
            {orderKeyword && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-white/55 hover:text-neutral-600"
                onClick={() => {
                  setOrderKeyword('')
                  onSearch({ orderKeyword: '' })
                }}
                aria-label="清除訂單關鍵字"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">備註關鍵字</label>
          <div className="relative">
            <Input
              value={notesKeyword}
              onChange={(event) => setNotesKeyword(event.target.value)}
              placeholder="輸入備註關鍵字"
              className="pr-9"
            />
            {notesKeyword && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-white/55 hover:text-neutral-600"
                onClick={() => {
                  setNotesKeyword('')
                  onSearch({ notesKeyword: '' })
                }}
                aria-label="清除備註關鍵字"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">開始日期</label>
          <div className="relative">
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              max={dateTo || undefined}
              className="pr-9"
            />
            {dateFrom && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-white/55 hover:text-neutral-600"
                onClick={() => {
                  setDateFrom('')
                  onSearch({ dateFrom: '' })
                }}
                aria-label="清除開始日期"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">結束日期</label>
          <div className="relative">
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              min={dateFrom || undefined}
              className="pr-9"
            />
            {dateTo && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-white/55 hover:text-neutral-600"
                onClick={() => {
                  setDateTo('')
                  onSearch({ dateTo: '' })
                }}
                aria-label="清除結束日期"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-x-2">
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
            <Search className="h-4 w-4 mr-2" />
            搜尋工時
          </Button>
          <Button type="button" variant="ghost" onClick={handleClear}>
            重設篩選
          </Button>
        </div>
        <p className="text-xs text-neutral-500 dark:text-white/65">
          最新工時會固定顯示在最上方，可輸入關鍵字或選擇日期範圍進行進階搜尋。
        </p>
      </div>
    </form>
  )
}

