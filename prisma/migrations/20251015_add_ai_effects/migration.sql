-- Add AI effects analysis fields to recipe_library table
ALTER TABLE "recipe_library" 
ADD COLUMN IF NOT EXISTS "aiEffectsAnalysis" TEXT,
ADD COLUMN IF NOT EXISTS "aiAnalyzedAt" TIMESTAMP;

-- Add comment
COMMENT ON COLUMN "recipe_library"."aiEffectsAnalysis" IS 'AI 分析的配方功效';
COMMENT ON COLUMN "recipe_library"."aiAnalyzedAt" IS 'AI 分析時間';

