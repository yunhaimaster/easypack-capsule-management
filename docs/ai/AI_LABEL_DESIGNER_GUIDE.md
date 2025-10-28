# AI Label Designer - Implementation Guide

## Overview
The AI Label Designer is a fully integrated, Hong Kong compliance-focused label generation system built into the Marketing Assistant page. It uses multiple AI models (GPT-5, Claude Sonnet 4.5, Grok 4) to generate professional, regulation-compliant label designs from product formulas.

## Features

### 1. AI-Driven Multi-Concept Generation
- **3–5 design concepts** generated in parallel by different AI models
- Each concept includes:
  - Complete layout with text, shapes, QR codes, barcodes
  - Color palette (3–5 colors)
  - Typography recommendations
  - Hong Kong compliance checklist
  - Overall quality score (0–100)

### 2. Hong Kong Regulatory Compliance
All generated labels automatically include:
- ✅ 產品名稱 (Product name, bilingual)
- ✅ 淨含量 (Net content)
- ✅ 使用方法 (Usage instructions)
- ✅ 注意事項 (Cautions/warnings)
- ✅ 存放方式 (Storage instructions)
- ✅ 製造商資訊 (Manufacturer info)
- ✅ 香港製造標示 ("Made in Hong Kong")
- ✅ 非藥物聲明 (Not a medicine disclaimer)
- ✅ 批次號及有效期 (Batch & expiry, recommended)

### 3. Vector Export
- **SVG export**: Layered, Illustrator-ready vector file with semantic group names
- **PDF export**: High-quality vector PDF (via `svg2pdf.js` + `jspdf`)
- No rasterization—fully editable in Adobe Illustrator

### 4. Interactive Preview
- Real-time SVG preview with zoom (50%–300%)
- Grid and guide overlays (bleed/safe zones)
- Element count and dimension display

## Architecture

### Black-Box Modular Design
Following Eskil Steenberg's methodology, each module is independently testable and replaceable:

```
┌─────────────────────────────────────────────────┐
│  Marketing Assistant Page (UI)                  │
│  - Formula input                                │
│  - Concept gallery                              │
│  - Canvas preview                               │
│  - Export controls                              │
└────────────┬────────────────────────────────────┘
             │
             v
┌─────────────────────────────────────────────────┐
│  /api/ai/label/generate (API Route)             │
│  - Parallel model calls (GPT-5, Claude, Grok)   │
│  - JSON schema validation & repair              │
│  - Scoring & ranking                            │
└────────────┬────────────────────────────────────┘
             │
             v
┌──────────────────┬──────────────────┬───────────┐
│  Renderer        │  Compliance      │  Prompts  │
│  (SVG Generator) │  (HK Validator)  │  (Builder)│
└──────────────────┴──────────────────┴───────────┘
             │
             v
┌─────────────────────────────────────────────────┐
│  Export                                         │
│  - SVG with QR/barcode injection                │
│  - PDF conversion (client-side)                 │
└─────────────────────────────────────────────────┘
```

### File Structure
```
src/
├── types/
│   └── label.ts                     # Type definitions (black-box schema)
├── lib/
│   ├── label-renderer.ts            # Template → SVG (deterministic)
│   ├── label-export.ts              # SVG → PDF, download helpers
│   ├── hk-label-compliance.ts       # HK validator & defaults
│   ├── ai/
│   │   └── label-prompts.ts         # Prompt engineering
│   └── __tests__/
│       ├── hk-label-compliance.test.ts
│       └── label-renderer.test.ts
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── label/
│   │           └── generate/
│   │               └── route.ts     # Multi-model generation API
│   └── marketing-assistant/
│       └── page.tsx                 # Integrated UI
└── components/
    └── marketing/
        └── labels/
            ├── ConceptCard.tsx      # Design preview card
            ├── LabelCanvas.tsx      # Interactive canvas
            └── ExportBar.tsx        # Export controls
```

## Usage

### 1. Navigate to Marketing Assistant
Go to `/marketing-assistant` in the app.

### 2. Input Formula
- Add ingredients manually or use Smart Recipe Import
- Enter product name (e.g., "膠原蛋白美肌膠囊")

### 3. Generate Designs
Click **"生成標籤設計"** button. The system will:
- Call 3 AI models in parallel
- Generate 3–5 unique design concepts
- Validate each against HK compliance rules
- Score and rank by quality

### 4. Review Concepts
- Browse concept cards showing:
  - SVG preview
  - Compliance status (✓ or ⚠)
  - Color palette
  - Typography
  - Score
- Click to select a concept for detailed preview

### 5. Export
- Click **"匯出 SVG"** for Illustrator-ready file
- Click **"匯出 PDF"** for print-ready vector PDF
- Files include all layers with semantic naming

## AI Models Used

### Generation (Parallel)
- **openai/gpt-5**: Layout JSON, copy, palette/typography (primary)
- **x-ai/grok-4**: Creative variants and alternative compositions
- **anthropic/claude-sonnet-4.5**: Compliance/consensus pass

### Configuration
- No reasoning parameters (all models run as-is)
- Standard OpenRouter API calls
- 60s timeout per model
- Graceful degradation if one model fails

## Compliance Features

### Automatic Insertion
`applyHKDefaults()` adds required text blocks if missing:
- Product name (centered, bilingual optional)
- Net content
- Usage instructions (default: "每日2粒，飯後溫水送服")
- Caution (red text for visibility)
- Storage instructions
- "香港製造 Made in Hong Kong" (green, bold)
- Manufacturer info
- Non-medicine disclaimer

### Validation
`validateHK()` checks for:
- All 9 compliance items
- Returns checklist with pass/warning/fail status
- Calculates overall score (0–100)

### Score Calculation
```typescript
Base score (compliance) +
Bonus for optimal element count (8–15) +
Penalty for safe-zone violations
= Final score (capped at 100)
```

## Technical Details

### Label Template Schema
```typescript
interface LabelTemplate {
  id: string
  name: string
  size: {
    widthMm: number
    heightMm: number
    bleedMm?: number  // default 2mm
    safeMm?: number   // default 3mm
  }
  elements: LabelElement[]  // array order = layer order
  variables?: Record<string, string>  // e.g. {{order.productName}}
  metadata?: {
    generatedBy?: string
    complianceScore?: number
  }
}
```

### Element Types
- **Text**: font, size, weight, align, color, line height
- **Image**: src (data URL or path), opacity
- **QR**: data, size, error correction
- **Barcode**: type (CODE128, EAN13, EAN8), display value
- **Shape**: rect, line, circle with stroke/fill

### Rendering Pipeline
1. Template JSON → `renderLabelToSVG()` at 96 DPI
2. Inject QR codes via `qrcode` library (SVG output)
3. Inject barcodes via `jsbarcode` (client-side for now)
4. Apply variable substitution
5. Export as SVG or convert to PDF

### Client-Side PDF Conversion
Uses `svg2pdf.js` + `jspdf`:
```typescript
const pdf = new jsPDF({ unit: 'mm', format: [width, height] })
await svg2pdf(svgElement, pdf, { x: 0, y: 0, width, height })
pdf.save(filename)
```

## Testing

### Unit Tests
- `hk-label-compliance.test.ts`: Validator logic, default insertion
- `label-renderer.test.ts`: SVG generation, variable substitution

### Run Tests
```bash
npm test -- src/lib/__tests__
```

## Dependencies
- `svg2pdf.js`: SVG → PDF conversion
- `jspdf`: PDF generation
- `qrcode`: QR code SVG generation
- `jsbarcode`: Barcode generation (client-side)
- `nanoid`: Unique ID generation

## Environment Variables
```bash
OPENROUTER_API_KEY=your_key_here
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
```

## Limitations & Future Enhancements

### Current Limitations
- Barcode generation is client-side only (requires native deps for server-side)
- No drag-and-drop WYSIWYG editor (readonly preview only)
- Fixed label size (140×60mm, can be customized via constraints)

### Potential Enhancements
- Multi-size support (A4 sheet layout, thermal roll)
- Drag-and-drop editor for fine-tuning
- Template library (save/load favorites)
- AI critique & improvement loop
- Multi-label merge (N-up printing)
- Database persistence for templates
- Image upload and embedding
- Advanced typography controls

## Troubleshooting

### "生成失敗" Error
- Check `OPENROUTER_API_KEY` is set
- Verify API key has credits
- Check network connectivity
- Review browser console for detailed error

### SVG Preview Not Showing
- Check browser supports inline SVG
- Verify template has valid elements
- Check for JavaScript errors in console

### PDF Export Fails
- Ensure `svg2pdf.js` and `jspdf` are installed
- Check browser allows downloads
- Try SVG export first to verify template is valid

### Compliance Score Low
- Review checklist for missing items
- Ensure product name, usage, caution are present
- Check for "香港製造" and non-medicine disclaimer
- Verify text is in Traditional Chinese

## Support
For issues or questions:
1. Check this guide first
2. Review test files for usage examples
3. Check browser console for errors
4. Verify all dependencies are installed

## Credits
Built using:
- OpenRouter API (multi-model access)
- OpenAI GPT-5, Anthropic Claude Sonnet 4.5, xAI Grok 4
- Next.js 14, React 18, TypeScript
- Tailwind CSS + Liquid Glass design system

