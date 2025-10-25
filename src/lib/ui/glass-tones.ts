export type GlassSemanticTone = 'positive' | 'caution' | 'negative' | 'neutral'

export const GLASS_BADGE_TONES: Record<GlassSemanticTone, string> = {
  positive: 'bg-emerald-500/15 border border-emerald-300/40 text-emerald-700',
  caution: 'bg-amber-500/15 border border-amber-300/40 text-amber-700',
  negative: 'bg-danger-500/15 border border-red-300/40 text-danger-700',
  neutral: 'bg-neutral-500/15 border border-neutral-300/40 text-neutral-600 dark:text-white/75'
}

export const GLASS_CARD_TONES: Record<GlassSemanticTone, string> = {
  positive: 'bg-emerald-500/10 border border-emerald-300/40 shadow-sm backdrop-blur-sm',
  caution: 'bg-amber-500/10 border border-amber-300/40 shadow-sm backdrop-blur-sm',
  negative: 'bg-danger-500/10 border border-red-300/40 shadow-sm backdrop-blur-sm',
  neutral: 'bg-neutral-500/10 border border-neutral-300/40 shadow-sm backdrop-blur-sm'
}

export const getGlassBadgeTone = (tone: GlassSemanticTone) => GLASS_BADGE_TONES[tone]

export const getGlassCardTone = (tone: GlassSemanticTone) => GLASS_CARD_TONES[tone]
