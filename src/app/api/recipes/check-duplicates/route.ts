import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeRecipeName } from '@/lib/recipe/merge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipeNames } = body

    if (!Array.isArray(recipeNames) || recipeNames.length === 0) {
      return NextResponse.json({
        success: true,
        duplicates: []
      })
    }

    // Get all existing recipe names from database
    const existingRecipes = await prisma.recipeLibrary.findMany({
      select: {
        recipeName: true
      }
    })

    // Normalize existing recipe names for comparison
    const existingNormalized = new Set(
      existingRecipes.map(r => normalizeRecipeName(r.recipeName))
    )

    // Find which of the provided names are duplicates
    const duplicates = recipeNames.filter(name => {
      const normalized = normalizeRecipeName(name)
      return existingNormalized.has(normalized)
    })

    return NextResponse.json({
      success: true,
      duplicates
    })
  } catch (error) {
    console.error('Error checking duplicate recipes:', error)
    return NextResponse.json(
      {
        success: false,
        error: '檢查重複配方時發生錯誤'
      },
      { status: 500 }
    )
  }
}

