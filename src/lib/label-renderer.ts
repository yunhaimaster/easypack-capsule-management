// Label Renderer - Template JSON → SVG (Illustrator-ready, layered)
// Black-box: deterministic, pure vector output, no AI logic here

import { LabelTemplate, LabelElement, TextElement, ImageElement, QRElement, BarcodeElement, ShapeElement } from '@/types/label'

const MM_TO_PX = 96 / 25.4 // 96 DPI standard for web

export interface RenderOptions {
  showBleed?: boolean
  showSafe?: boolean
  showGuides?: boolean
  dpi?: number // default 96
}

export function renderLabelToSVG(template: LabelTemplate, options: RenderOptions = {}): string {
  const { showBleed = false, showSafe = false, showGuides = false, dpi = 96 } = options
  const scale = dpi / 25.4

  const { widthMm, heightMm, bleedMm = 2, safeMm = 3 } = template.size
  const totalWidth = (widthMm + (showBleed ? bleedMm * 2 : 0)) * scale
  const totalHeight = (heightMm + (showBleed ? bleedMm * 2 : 0)) * scale
  const offsetX = showBleed ? bleedMm * scale : 0
  const offsetY = showBleed ? bleedMm * scale : 0

  const width = widthMm * scale
  const height = heightMm * scale

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&amp;display=swap');
    </style>
  </defs>
`

  // Background
  svg += `  <rect x="${offsetX}" y="${offsetY}" width="${width}" height="${height}" fill="white"/>\n`

  // Guides (optional, for design preview only)
  if (showBleed) {
    svg += `  <g id="guides-bleed" opacity="0.5">
    <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="none" stroke="red" stroke-width="0.5" stroke-dasharray="2,2"/>
  </g>\n`
  }
  if (showSafe) {
    const safeX = offsetX + safeMm * scale
    const safeY = offsetY + safeMm * scale
    const safeW = width - safeMm * 2 * scale
    const safeH = height - safeMm * 2 * scale
    svg += `  <g id="guides-safe" opacity="0.5">
    <rect x="${safeX}" y="${safeY}" width="${safeW}" height="${safeH}" fill="none" stroke="green" stroke-width="0.5" stroke-dasharray="2,2"/>
  </g>\n`
  }

  // Render elements in layer order
  svg += `  <g id="content">\n`
  template.elements.forEach((el, idx) => {
    svg += renderElement(el, scale, offsetX, offsetY, idx)
  })
  svg += `  </g>\n`

  svg += `</svg>`
  return svg
}

function renderElement(el: LabelElement, scale: number, offsetX: number, offsetY: number, idx: number): string {
  const x = el.x * scale + offsetX
  const y = el.y * scale + offsetY

  switch (el.kind) {
    case 'text':
      return renderText(el, x, y, scale, idx)
    case 'image':
      return renderImage(el, x, y, scale, idx)
    case 'qr':
      return renderQR(el, x, y, scale, idx)
    case 'barcode':
      return renderBarcode(el, x, y, scale, idx)
    case 'shape':
      return renderShape(el, x, y, scale, offsetX, offsetY, idx)
    default:
      return ''
  }
}

function renderText(el: TextElement, x: number, y: number, scale: number, idx: number): string {
  const { text, font, color, w, h, lineHeight = 1.2 } = el
  const fontSize = font.sizePt
  const fontFamily = font.family || 'Noto Sans TC, sans-serif'
  const fontWeight = font.weight || 400
  const textAnchor = font.align === 'center' ? 'middle' : font.align === 'right' ? 'end' : 'start'
  const adjustedX = font.align === 'center' && w ? x + (w * scale) / 2 : font.align === 'right' && w ? x + w * scale : x

  // Escape text for XML
  const escapedText = escapeXML(text)

  return `    <g id="text-${el.id}" data-layer="text-${idx}">
      <text x="${adjustedX}" y="${y + fontSize * 0.8}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}" text-anchor="${textAnchor}" xml:space="preserve">${escapedText}</text>
    </g>\n`
}

function renderImage(el: ImageElement, x: number, y: number, scale: number, idx: number): string {
  const w = el.w * scale
  const h = el.h * scale
  const opacity = el.opacity !== undefined ? el.opacity : 1

  return `    <g id="image-${el.id}" data-layer="image-${idx}" opacity="${opacity}">
      <image x="${x}" y="${y}" width="${w}" height="${h}" xlink:href="${el.src}" preserveAspectRatio="xMidYMid slice"/>
    </g>\n`
}

function renderQR(el: QRElement, x: number, y: number, scale: number, idx: number): string {
  const size = el.size * scale
  // Placeholder - will be replaced by actual QR SVG in export step
  return `    <g id="qr-${el.id}" data-layer="qr-${idx}" data-qr-data="${escapeXML(el.data)}" data-qr-size="${el.size}">
      <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="none" stroke="#000" stroke-width="1"/>
      <text x="${x + size / 2}" y="${y + size / 2}" text-anchor="middle" font-size="8" fill="#666">QR</text>
    </g>\n`
}

function renderBarcode(el: BarcodeElement, x: number, y: number, scale: number, idx: number): string {
  const w = el.w * scale
  const h = el.h * scale
  // Placeholder - will be replaced by actual barcode SVG in export step
  return `    <g id="barcode-${el.id}" data-layer="barcode-${idx}" data-barcode-type="${el.type}" data-barcode-data="${el.data}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#000" stroke-width="1"/>
      <text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" font-size="8" fill="#666">${el.type}</text>
    </g>\n`
}

function renderShape(el: ShapeElement, x: number, y: number, scale: number, offsetX: number, offsetY: number, idx: number): string {
  const { shape, w, h, r, x2, y2, stroke, fill, strokeWidth = 1, opacity = 1 } = el
  const strokeAttr = stroke ? `stroke="${stroke}"` : 'stroke="none"'
  const fillAttr = fill ? `fill="${fill}"` : 'fill="none"'

  let shapeEl = ''
  if (shape === 'rect' && w !== undefined && h !== undefined) {
    shapeEl = `<rect x="${x}" y="${y}" width="${w * scale}" height="${h * scale}" ${strokeAttr} ${fillAttr} stroke-width="${strokeWidth}"/>`
  } else if (shape === 'line' && x2 !== undefined && y2 !== undefined) {
    const endX = x2 * scale + offsetX
    const endY = y2 * scale + offsetY
    shapeEl = `<line x1="${x}" y1="${y}" x2="${endX}" y2="${endY}" ${strokeAttr} stroke-width="${strokeWidth}"/>`
  } else if (shape === 'circle' && r !== undefined) {
    shapeEl = `<circle cx="${x}" cy="${y}" r="${r * scale}" ${strokeAttr} ${fillAttr} stroke-width="${strokeWidth}"/>`
  }

  return `    <g id="shape-${el.id}" data-layer="shape-${idx}" opacity="${opacity}">
      ${shapeEl}
    </g>\n`
}

function escapeXML(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function applyVariables(template: LabelTemplate, data: Record<string, string>): LabelTemplate {
  const cloned = JSON.parse(JSON.stringify(template)) as LabelTemplate
  
  cloned.elements = cloned.elements.map(el => {
    if (el.kind === 'text') {
      let text = el.text
      Object.entries(data).forEach(([key, value]) => {
        text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
      })
      return { ...el, text }
    }
    if (el.kind === 'qr' || el.kind === 'barcode') {
      let data = el.data
      Object.entries(data).forEach(([key, value]) => {
        data = data.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
      })
      return { ...el, data }
    }
    return el
  })

  return cloned
}

