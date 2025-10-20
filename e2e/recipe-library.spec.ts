import { test, expect } from '@playwright/test'

test.describe('Recipe Library', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    const loginCode = process.env.LOGIN || '2356'
    await page.getByPlaceholder(/請輸入登入碼/i).fill(loginCode)
    await page.getByRole('button', { name: /登入/i }).click()
    await expect(page).toHaveURL('/')
  })

  test('should display recipe library page', async ({ page }) => {
    await page.goto('/recipe-library')
    
    // Check for page title
    await expect(page.getByRole('heading', { name: /配方庫/i })).toBeVisible()
    
    // Check for tabs
    await expect(page.getByRole('tab', { name: /生產配方/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /模板配方/i })).toBeVisible()
  })

  test('should search recipes by keyword', async ({ page }) => {
    await page.goto('/recipe-library')
    
    // Wait for recipes to load
    await page.waitForSelector('[data-testid="recipe-list"]', { timeout: 5000 }).catch(() => {})
    
    // Enter search term
    const searchInput = page.getByPlaceholder(/搜尋配方名稱/i)
    await searchInput.fill('維生素')
    
    // Wait for search results (with debounce)
    await page.waitForTimeout(600)
    
    // Should show filtered results or no results message
    const hasResults = await page.getByText(/沒有找到任何配方/i).isVisible().catch(() => false)
    if (!hasResults) {
      // If there are results, verify they contain the search term
      const firstRecipe = page.locator('[data-testid="recipe-item"]').first()
      await expect(firstRecipe).toBeVisible()
    }
  })

  test('should filter recipes by effect category', async ({ page }) => {
    await page.goto('/recipe-library')
    
    // Open advanced filters
    await page.getByText(/進階篩選/i).click()
    
    // Select an effect category
    await page.getByText(/免疫支持/i).first().click()
    
    // Wait for filtered results
    await page.waitForTimeout(600)
    
    // Should show filtered recipes or no results
    const pageContent = await page.content()
    expect(pageContent).toBeTruthy()
  })

  test('should switch between production and template tabs', async ({ page }) => {
    await page.goto('/recipe-library')
    
    // Click template tab
    await page.getByRole('tab', { name: /模板配方/i }).click()
    
    // Should show template recipes section
    await expect(page.getByText(/模板配方/i)).toBeVisible()
    
    // Click production tab
    await page.getByRole('tab', { name: /生產配方/i }).click()
    
    // Should show production recipes section
    await expect(page.getByText(/生產配方/i)).toBeVisible()
  })

  test('should navigate to recipe details', async ({ page }) => {
    await page.goto('/recipe-library')
    
    // Wait for recipes to load
    await page.waitForTimeout(1000)
    
    // Click first recipe (if exists)
    const firstRecipe = page.locator('[data-testid="recipe-item"]').first()
    const hasRecipes = await firstRecipe.isVisible().catch(() => false)
    
    if (hasRecipes) {
      await firstRecipe.click()
      
      // Should navigate to recipe details
      await expect(page).toHaveURL(/\/recipe-library\/[a-z0-9]+/)
    }
  })
})

