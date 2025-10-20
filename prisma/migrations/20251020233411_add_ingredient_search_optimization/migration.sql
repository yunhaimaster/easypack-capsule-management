-- Add GIN index for ingredient search optimization
-- This index enables fast full-text search within JSON ingredient arrays

-- Add GIN index on ingredients JSON field for efficient searching
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_gin ON recipe_library USING GIN (ingredients jsonb_path_ops);

-- Add index on aiEffectsAnalysis for faster keyword matching
CREATE INDEX IF NOT EXISTS idx_recipe_effects_analysis ON recipe_library USING GIN (to_tsvector('english', COALESCE(ai_effects_analysis, '')));

-- Add index on description for faster text search
CREATE INDEX IF NOT EXISTS idx_recipe_description ON recipe_library (description text_pattern_ops);

