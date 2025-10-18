export type GlassSemanticTone = 'positive' | 'caution' | 'negative' | 'neutral'

export const GLASS_BADGE_TONES: Record<GlassSemanticTone, string> = {
  positive: 'bg-emerald-500/15 border border-emerald-300/40 text-emerald-700',
  caution: 'bg-amber-500/15 border border-amber-300/40 text-amber-700',
  negative: 'bg-red-500/15 border border-red-300/40 text-red-700',
  neutral: 'bg-slate-500/15 border border-slate-300/40 text-slate-600'
}

export const GLASS_CARD_TONES: Record<GlassSemanticTone, string> = {
  positive: 'bg-emerald-500/10 border border-emerald-300/40 shadow-sm backdrop-blur-sm',
  caution: 'bg-amber-500/10 border border-amber-300/40 shadow-sm backdrop-blur-sm',
  negative: 'bg-red-500/10 border border-red-300/40 shadow-sm backdrop-blur-sm',
  neutral: 'bg-slate-500/10 border border-slate-300/40 shadow-sm backdrop-blur-sm'
}

export const getGlassBadgeTone = (tone: GlassSemanticTone) => GLASS_BADGE_TONES[tone]

export const getGlassCardTone = (tone: GlassSemanticTone) => GLASS_CARD_TONES[tone]
