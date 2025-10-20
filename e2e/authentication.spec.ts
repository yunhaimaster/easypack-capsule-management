import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    
    // Check for login form elements
    await expect(page.getByRole('heading', { name: /登入/i })).toBeVisible()
    await expect(page.getByPlaceholder(/請輸入登入碼/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /登入/i })).toBeVisible()
  })

  test('should show error for incorrect password', async ({ page }) => {
    await page.goto('/login')
    
    // Enter incorrect password
    await page.getByPlaceholder(/請輸入登入碼/i).fill('wrong-password')
    await page.getByRole('button', { name: /登入/i }).click()
    
    // Should see error message
    await expect(page.getByText(/登入碼錯誤/i)).toBeVisible()
  })

  test('should redirect to home after successful login', async ({ page }) => {
    await page.goto('/login')
    
    // Enter correct password (using env variable)
    const loginCode = process.env.LOGIN || '2356'
    await page.getByPlaceholder(/請輸入登入碼/i).fill(loginCode)
    await page.getByRole('button', { name: /登入/i }).click()
    
    // Should redirect to home
    await expect(page).toHaveURL('/')
    
    // Should see home page content
    await expect(page.getByText(/Easy Health/i)).toBeVisible()
  })

  test('should protect routes when not authenticated', async ({ page, context }) => {
    // Clear any existing auth
    await context.clearCookies()
    await page.goto('/')
    
    // Try to access protected route
    await page.goto('/orders')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})

