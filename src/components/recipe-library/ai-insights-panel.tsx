'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  AlertTriangle, 
  DollarSign, 
  Lightbulb, 
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { RecipeLibraryItem } from '@/types'

interface AIInsightsPanelProps {
  recipe: RecipeLibraryItem
}

export function AIInsightsPanel({ recipe }: AIInsightsPanelProps) {
  const [riskAssessment, setRiskAssessment] = useState<any>(null)
  const [priceEstimation, setPriceEstimation] = useState<any>(null)
  const [alternatives, setAlternatives] = useState<any>(null)
  
  const [loadingRisk, setLoadingRisk] = useState(false)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [loadingAlternatives, setLoadingAlternatives] = useState(false)
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const analyzeRisk = async () => {
    setLoadingRisk(true)
    try {
      const materials = recipe.ingredients.map(ing => ing.materialName)
      const response = await fetch('/api/ai/assess-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials })
      })
      const data = await response.json()
      setRiskAssessment(data.assessments)
      setExpandedSection('risk')
    } catch (error) {
      console.error('Risk assessment error:', error)
    } finally {
      setLoadingRisk(false)
    }
  }

  const analyzePrices = async () => {
    setLoadingPrice(true)
    try {
      const analyses = await Promise.all(
        recipe.ingredients.map(async (ing) => {
          const response = await fetch('/api/ai/price-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              materialName: ing.materialName,
              analysisType: 'quick'
            })
          })
          return response.json()
        })
      )
      setPriceEstimation(analyses)
      setExpandedSection('price')
    } catch (error) {
      console.error('Price analysis error:', error)
    } finally {
      setLoadingPrice(false)
    }
  }

  const suggestAlternatives = async () => {
    setLoadingAlternatives(true)
    try {
      const response = await fetch('/api/recipes/suggest-alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipeId: recipe.id,
          ingredients: recipe.ingredients 
        })
      })
      const data = await response.json()
      setAlternatives(data.suggestions)
      setExpandedSection('alternatives')
    } catch (error) {
      console.error('Alternatives error:', error)
    } finally {
      setLoadingAlternatives(false)
    }
  }

  return (
    <Card className="liquid-glass-card liquid-glass-card-elevated">
      <div className="liquid-glass-content">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">
          AI 智能分析
        </h2>
        
        <div className="space-y-3">
          {/* Risk Assessment */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-neutral-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning-600" />
                <span className="font-medium text-neutral-800">風險評估</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={analyzeRisk}
                disabled={loadingRisk}
              >
                {loadingRisk ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : riskAssessment ? (
                  expandedSection === 'risk' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                ) : (
                  '分析'
                )}
              </Button>
            </div>
            {expandedSection === 'risk' && riskAssessment && (
              <div className="p-3 space-y-2">
                {riskAssessment.map((assessment: any, index: number) => (
                  <div key={index} className="p-2 bg-white border border-neutral-200 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{assessment.materialName}</span>
                      <Badge
                        variant={
                          assessment.riskLevel === '高風險' ? 'destructive' :
                          assessment.riskLevel === '中風險' ? 'default' : 'secondary'
                        }
                      >
                        {assessment.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-600">
                      {assessment.riskReasons?.[0] || assessment.technicalNotes}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price Estimation */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-neutral-50">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success-600" />
                <span className="font-medium text-neutral-800">成本估算</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={analyzePrices}
                disabled={loadingPrice}
              >
                {loadingPrice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : priceEstimation ? (
                  expandedSection === 'price' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                ) : (
                  '分析'
                )}
              </Button>
            </div>
            {expandedSection === 'price' && priceEstimation && (
              <div className="p-3">
                <p className="text-xs text-neutral-600">
                  價格分析功能正在開發中，將提供詳細的成本估算和優化建議。
                </p>
              </div>
            )}
          </div>

          {/* Alternatives & Improvements */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-neutral-50">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary-600" />
                <span className="font-medium text-neutral-800">優化建議</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={suggestAlternatives}
                disabled={loadingAlternatives}
              >
                {loadingAlternatives ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : alternatives ? (
                  expandedSection === 'alternatives' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                ) : (
                  '分析'
                )}
              </Button>
            </div>
            {expandedSection === 'alternatives' && alternatives && (
              <div className="p-3 space-y-2">
                {alternatives.map((suggestion: any, index: number) => (
                  <div key={index} className="p-2 bg-primary-50 border border-primary-200 rounded">
                    <p className="text-sm text-primary-800 font-medium mb-1">
                      {suggestion.title}
                    </p>
                    <p className="text-xs text-primary-700">
                      {suggestion.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

