-- AlterTable
ALTER TABLE "recipe_library" ADD COLUMN "recipeType" TEXT NOT NULL DEFAULT 'production',
ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'order';

-- CreateIndex
CREATE INDEX "recipe_library_recipeType_idx" ON "recipe_library"("recipeType");

-- CreateIndex
CREATE INDEX "recipe_library_sourceType_idx" ON "recipe_library"("sourceType");

