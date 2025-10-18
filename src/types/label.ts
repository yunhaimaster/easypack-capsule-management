// Label Designer Types - Hong Kong Market
// Black-box, future-proof schema for AI-driven label generation

export type LabelElementKind = 'text' | 'image' | 'qr' | 'barcode' | 'shape'

export interface TextElement {
  kind: 'text'
  id: string
  x: number // mm from left
  y: number // mm from top
  w?: number // width constraint (mm), optional for auto-sizing
  h?: number // height constraint (mm)
  text: string
  font: {
    family: string // e.g., 'Noto Sans TC', 'Arial'
    sizePt: number // font size in points
    weight?: number // 400, 500, 600, 700, etc.
    align?: 'left' | 'center' | 'right'
  }
  color: string // hex color, e.g., '#1F2937'
  lineHeight?: number // multiplier, e.g., 1.2
}

export interface ImageElement {
  kind: 'image'
  id: string
  x: number
  y: number
  w: number
  h: number
  src: string // data URL or public path
  opacity?: number
}

export interface QRElement {
  kind: 'qr'
  id: string
  x: number
  y: number
  size: number // mm
  data: string // QR code data (URL, text, etc.)
  errorCorrection?: 'L' | 'M' | 'Q' | 'H'
}

export interface BarcodeElement {
  kind: 'barcode'
  id: string
  x: number
  y: number
  w: number
  h: number
  type: 'CODE128' | 'EAN13' | 'EAN8'
  data: string
  displayValue?: boolean
}

export interface ShapeElement {
  kind: 'shape'
  id: string
  shape: 'rect' | 'line' | 'circle'
  x: number
  y: number
  w?: number // for rect/line
  h?: number // for rect
  r?: number // for circle (radius)
  x2?: number // for line (end point)
  y2?: number // for line (end point)
  stroke?: string
  fill?: string
  strokeWidth?: number
  opacity?: number
}

export type LabelElement = TextElement | ImageElement | QRElement | BarcodeElement | ShapeElement

export interface LabelSize {
  widthMm: number
  heightMm: number
  bleedMm?: number // default 2mm
  safeMm?: number // default 3mm
}

export interface LabelTemplate {
  id: string
  name: string
  size: LabelSize
  variables?: Record<string, string> // supports tokens like {{order.productName}}
  elements: LabelElement[] // layering order = array order (first = bottom)
  metadata?: {
    generatedBy?: string // model name
    complianceScore?: number
    createdAt?: string
  }
}

export interface LabelGenerationRequest {
  formula: {
    productName: string
    ingredients: Array<{ materialName: string; unitContentMg: number }>
    targetAudience?: string
    claims?: string[]
  }
  constraints?: {
    sizeMm?: { width: number; height: number }
    palette?: string[] // preferred colors
    style?: 'modern' | 'classic' | 'minimal' | 'bold'
    bilingual?: boolean // ZH/EN
  }
  orderId?: string // optional, for variable binding
}

export interface LabelConcept {
  template: LabelTemplate
  svgPreview: string
  compliance: {
    passed: boolean
    checklist: Array<{ item: string; status: 'pass' | 'warning' | 'fail'; message?: string }>
  }
  score: number // 0-100
  palette: string[]
  typography: { primary: string; secondary: string }
}

export interface HKComplianceData {
  productName: string
  netContent?: string // e.g., "60粒"
  usage?: string
  caution?: string
  storage?: string
  manufacturer?: string
  contactInfo?: string
  batchNumber?: string
  expiryDate?: string
  madeInHK?: boolean // default true
}

