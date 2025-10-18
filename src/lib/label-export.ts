// Label Export - SVG → PDF (vector), QR/Barcode injection
// Black-box: deterministic export, no AI logic

import { LabelTemplate } from '@/types/label'
import { renderLabelToSVG, applyVariables } from './label-renderer'

export interface ExportOptions {
  format: 'svg' | 'pdf'
  includeGuides?: boolean
  data?: Record<string, string> // variable substitution
}

/**
 * Export label to SVG string
 */
export async function exportLabelSVG(
  template: LabelTemplate,
  options: ExportOptions = { format: 'svg' }
): Promise<string> {
  const { data } = options
  const finalTemplate = data ? applyVariables(template, data) : template

  // Inject QR codes and barcodes
  let svg = renderLabelToSVG(finalTemplate, { showBleed: false, showSafe: false })
  
  // Replace QR placeholders with actual QR codes
  const qrElements = finalTemplate.elements.filter(el => el.kind === 'qr')
  for (const qrEl of qrElements) {
    if (qrEl.kind === 'qr') {
      const qrSVG = await generateQRCodeSVG(qrEl.data, qrEl.size)
      // Extract the inner SVG content and replace placeholder
      const placeholderRegex = new RegExp(`<g id="qr-${qrEl.id}"[^>]*>.*?</g>`, 's')
      const qrGroup = `<g id="qr-${qrEl.id}" data-layer="qr">${qrSVG}</g>`
      svg = svg.replace(placeholderRegex, qrGroup)
    }
  }

  // Replace barcode placeholders with actual barcodes
  const barcodeElements = finalTemplate.elements.filter(el => el.kind === 'barcode')
  for (const bcEl of barcodeElements) {
    if (bcEl.kind === 'barcode') {
      const barcodeSVG = await generateBarcodeSVG(bcEl.data, bcEl.type, bcEl.w, bcEl.h)
      const placeholderRegex = new RegExp(`<g id="barcode-${bcEl.id}"[^>]*>.*?</g>`, 's')
      const barcodeGroup = `<g id="barcode-${bcEl.id}" data-layer="barcode">${barcodeSVG}</g>`
      svg = svg.replace(placeholderRegex, barcodeGroup)
    }
  }

  return svg
}

/**
 * Export label to PDF (vector)
 * Note: For now, we return SVG. Client will convert to PDF using svg2pdf.js + jspdf
 */
export async function exportLabelPDF(
  template: LabelTemplate,
  options: ExportOptions = { format: 'pdf' }
): Promise<Blob> {
  const svg = await exportLabelSVG(template, options)
  
  // This will be handled on the client side with svg2pdf.js
  // For now, return SVG as blob
  return new Blob([svg], { type: 'image/svg+xml' })
}

/**
 * Generate QR code as SVG string
 * Uses dynamic import to avoid bundling qrcode on server
 */
async function generateQRCodeSVG(data: string, sizeMm: number): Promise<string> {
  try {
    // Dynamic import for qrcode
    const QRCode = (await import('qrcode')).default
    
    // Generate QR as data URL
    const qrDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      margin: 0,
      width: sizeMm * (96 / 25.4) // Convert mm to px at 96 DPI
    })

    const size = sizeMm * (96 / 25.4)
    return `<image width="${size}" height="${size}" xlink:href="${qrDataURL}"/>`
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    // Fallback placeholder
    const size = sizeMm * (96 / 25.4)
    return `<rect width="${size}" height="${size}" fill="#f3f4f6" stroke="#9ca3af"/>
            <text x="${size / 2}" y="${size / 2}" text-anchor="middle" font-size="10" fill="#6b7280">QR</text>`
  }
}

/**
 * Generate barcode as SVG string
 * Note: Server-side barcode generation requires canvas, which has native deps.
 * For now, return placeholder. Client-side components will inject real barcodes.
 */
async function generateBarcodeSVG(
  data: string,
  type: string,
  widthMm: number,
  heightMm: number
): Promise<string> {
  // Placeholder - will be replaced by client-side jsbarcode rendering
  const w = widthMm * (96 / 25.4)
  const h = heightMm * (96 / 25.4)
  return `<rect width="${w}" height="${h}" fill="#f3f4f6" stroke="#9ca3af"/>
          <text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-size="10" fill="#6b7280">${type}</text>`
}

/**
 * Download helper for client-side
 */
export function downloadSVG(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Convert SVG to PDF on client using svg2pdf.js + jspdf
 * This is a helper that will be called from client components
 */
export async function convertSVGToPDFClient(svgString: string, filename: string) {
  if (typeof window === 'undefined') {
    throw new Error('This function must be called on the client side')
  }

  try {
    const { jsPDF } = await import('jspdf')
    const { svg2pdf } = await import('svg2pdf.js')
    
    // Parse SVG
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgElement = svgDoc.documentElement as unknown as SVGSVGElement

    // Get dimensions from SVG viewBox
    const viewBox = svgElement.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 210, 297]
    const width = viewBox[2] * 0.264583 // px to mm at 96 DPI
    const height = viewBox[3] * 0.264583

    // Create PDF
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [width, height]
    })

    // Convert SVG to PDF
    await svg2pdf(svgElement, pdf, {
      x: 0,
      y: 0,
      width,
      height
    })

    // Download
    pdf.save(filename)
  } catch (error) {
    console.error('Failed to convert SVG to PDF:', error)
    throw new Error('PDF 轉換失敗，請稍後再試')
  }
}

