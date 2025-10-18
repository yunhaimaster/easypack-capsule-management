import { z } from 'zod'

// ===== Constants =====
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
const TIME_ERROR_MESSAGE = '時間格式必須為 HH:MM (例如: 08:30)'
const DATE_ERROR_MESSAGE = '請選擇有效的日期'

// ===== Helper Functions =====
const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ')
}

// ===== Custom Validators =====
const createStringValidator = (fieldName: string, minLength: number, maxLength: number) => {
  return z
    .string({ required_error: `${fieldName}為必填項` })
    .min(1, `${fieldName}不能為空`)
    .max(maxLength, `${fieldName}不能超過${maxLength}字`)
    .transform(sanitizeString)
    .refine((val) => val.length >= minLength, {
      message: `${fieldName}至少需要${minLength}個字符`
    })
}

const worklogBaseSchema = z.object({
  workDate: z.string().min(1, '工作日期必須填寫'),
  headcount: z.coerce.number().int('人數必須為整數').min(1, '人數至少為 1'),
  startTime: z.string().regex(timeRegex, '開始時間格式錯誤'),
  endTime: z.string().regex(timeRegex, '結束時間格式錯誤'),
  notes: z.string().max(500, '備註不能超過 500 字').optional().nullable()
}).refine((data) => {
  const start = toMinutes(data.startTime)
  const end = toMinutes(data.endTime)
  return end > start
}, {
  message: '結束時間必須晚於開始時間',
  path: ['endTime']
})

export const ingredientSchema = z.object({
  materialName: z
    .string()
    .min(1, '原料品名不能為空')
    .max(100, '原料品名不能超過100字')
    .refine((val) => val.trim().length > 0, '原料品名不能為空白')
    .refine((val) => !/^[\s]*$/.test(val), '原料品名不能只包含空格')
    .refine((val) => val.length >= 2, '原料品名至少需要2個字符'),
  unitContentMg: z
    .number()
    .positive('單粒含量必須為正數')
    .min(0.00001, '單粒含量不能小於0.00001mg')
    .max(10000, '單粒含量不能超過10,000mg')
    .refine((val) => {
      // 確保 val 是數字類型再調用 toFixed
      if (typeof val !== 'number' || isNaN(val)) return false
      return Number(val.toFixed(5)) === val
    }, '單粒含量精度不能超過小數點後5位')
    .refine((val) => val > 0, '單粒含量必須大於0'),
  isCustomerProvided: z
    .boolean()
    .default(true),
  isCustomerSupplied: z
    .boolean()
    .default(true)
})

export const productionOrderSchema = z.object({
  customerName: z
    .string()
    .min(1, '客戶名稱不能為空')
    .max(100, '客戶名稱不能超過100字'),
  productName: z
    .string()
    .min(1, '產品名字不能為空')
    .max(100, '產品名字不能超過100字')
    .default('未命名產品'),
  productionQuantity: z
    .number()
    .int('生產數量必須為整數')
    .positive('生產數量必須為正數')
    .min(1, '生產數量不能小於1')
    .max(5000000, '生產數量不能超過5,000,000粒'),
  unitWeightMg: z
    .number()
    .positive('單粒重量必須大於0')
    .default(500),
  batchTotalWeightMg: z
    .number()
    .positive('批次總重量必須大於0')
    .default(0),
  completionDate: z.string().optional(),
  processIssues: z
    .string()
    .max(1000, '製程問題記錄不能超過1000字')
    .optional()
    .nullable(),
  qualityNotes: z
    .string()
    .max(500, '品管備註不能超過500字')
    .optional()
    .nullable(),
  capsuleColor: z
    .string()
    .max(50, '膠囊顏色不能超過50字')
    .optional()
    .nullable(),
  capsuleSize: z
    .enum(['#1', '#0', '#00'], {
      errorMap: () => ({ message: '請選擇膠囊大小' })
    })
    .optional()
    .nullable(),
  capsuleType: z
    .enum(['明膠胃溶', '植物胃溶', '明膠腸溶', '植物腸溶'], {
      errorMap: () => ({ message: '請選擇膠囊成份' })
    })
    .optional()
    .nullable(),
  customerService: z
    .string({ required_error: '客服姓名不能為空' })
    .min(1, '客服姓名不能為空')
    .max(100, '客服姓名不能超過100字')
    .optional()
    .nullable(),
  actualProductionQuantity: z
    .number({ invalid_type_error: '實際生產數量必須為數字' })
    .int('實際生產數量必須為整數')
    .min(0, '實際生產數量不可小於0')
    .optional()
    .nullable(),
  materialYieldQuantity: z
    .number({ invalid_type_error: '材料可做數量必須為數字' })
    .int('材料可做數量必須為整數')
    .min(0, '材料可做數量不可小於0')
    .optional()
    .nullable(),
  worklogs: z.array(z.any()).optional(),
  ingredients: z
    .array(ingredientSchema)
    .min(1, '至少需要一項原料')
    .refine(
      (ingredients) => {
        const names = ingredients.map(i => i.materialName)
        return new Set(names).size === names.length
      },
      '同一配方內原料品名不能重複'
    )
    .refine(
      (ingredients) => {
        const totalWeight = ingredients.reduce((sum, i) => sum + i.unitContentMg, 0)
        return totalWeight > 0
      },
      '單粒總重量必須為正值'
    )
})

export const searchFiltersSchema = z.object({
  customerName: z.string().optional(),
  productName: z.string().optional(),
  ingredientName: z.string().optional(),
  capsuleType: z.string().optional(),
  dateTo: z.date().optional(),
  minQuantity: z.number().int().positive().optional(),
  maxQuantity: z.number().int().positive().optional(),
  isCompleted: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
  sortBy: z.enum(['createdAt', 'productionQuantity', 'customerName', 'productName', 'completionDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export const worklogSchema = worklogBaseSchema

export const worklogFiltersSchema = z.object({
  orderKeyword: z.string().trim().min(1).max(120).optional(),
  notesKeyword: z.string().trim().min(1).max(200).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).refine((data) => {
  if (data.dateFrom && data.dateTo) {
    return data.dateFrom <= data.dateTo
  }
  return true
}, {
  message: '開始日期不得晚於結束日期',
  path: ['dateFrom']
})

export type ProductionOrderFormData = z.infer<typeof productionOrderSchema>
export type IngredientFormData = z.infer<typeof ingredientSchema>
export type SearchFiltersFormData = z.infer<typeof searchFiltersSchema>
export type WorklogFiltersFormData = z.infer<typeof worklogFiltersSchema>
