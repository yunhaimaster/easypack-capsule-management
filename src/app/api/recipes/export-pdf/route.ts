import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { recipeId } = await request.json()
    
    const recipe = await prisma.recipeLibrary.findUnique({
      where: { id: recipeId }
    })
    
    if (!recipe) {
      return NextResponse.json({
        success: false,
        error: '配方不存在'
      }, { status: 404 })
    }
    
    // Simple HTML to PDF conversion
    const ingredients = JSON.parse(recipe.ingredients as string)
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${recipe.recipeName}</title>
  <style>
    body { font-family: "Microsoft JhengHei", sans-serif; margin: 40px; }
    h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .section { margin: 30px 0; }
    .label { font-weight: bold; color: #374151; }
  </style>
</head>
<body>
  <h1>${recipe.recipeName}</h1>
  
  <div class="section">
    <p><span class="label">客戶：</span>${recipe.customerName}</p>
    <p><span class="label">產品：</span>${recipe.productName}</p>
    <p><span class="label">配方類型：</span>${recipe.recipeType === 'production' ? '生產配方' : '模板配方'}</p>
  </div>
  
  <div class="section">
    <h2>原料清單</h2>
    <table>
      <thead>
        <tr>
          <th>原料名稱</th>
          <th>單粒含量 (mg)</th>
        </tr>
      </thead>
      <tbody>
        ${ingredients.map((ing: any) => `
          <tr>
            <td>${ing.materialName}</td>
            <td>${ing.unitContentMg}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <p><span class="label">單粒總重量：</span>${recipe.unitWeightMg} mg</p>
  </div>
  
  ${recipe.aiEffectsAnalysis ? `
  <div class="section">
    <h2>AI 功效分析</h2>
    <p>${recipe.aiEffectsAnalysis}</p>
  </div>
  ` : ''}
  
  <div class="section">
    <p style="color: #6b7280; font-size: 12px;">
      生成時間：${new Date().toLocaleString('zh-HK')}
    </p>
  </div>
</body>
</html>
    `
    
    // Return HTML as response (browser can print to PDF)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="recipe_${recipeId}.html"`
      }
    })
  } catch (error) {
    console.error('Export PDF error:', error)
    return NextResponse.json({
      success: false,
      error: '導出失敗'
    }, { status: 500 })
  }
}

