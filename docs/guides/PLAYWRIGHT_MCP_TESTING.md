# Testing Playwright MCP Server

Quick guide for testing your Playwright MCP integration.

## Prerequisites

✅ Playwright MCP installed: Version 0.0.44  
✅ Configuration: `/Users/yunhaimaster/.cursor/mcp.json`  
✅ Playwright tests: `e2e/authentication.spec.ts`

---

## Step 1: Restart Cursor

After adding Playwright MCP, **restart Cursor** to load the new server.

---

## Step 2: Verify Installation

In Cursor chat, ask:
```
"List all MCP servers you have access to"
```

You should see `playwright` in the list.

---

## Step 3: Basic Tests (Localhost Only)

These commands work when your dev server is running:

### A. Take a Screenshot
```
"Take a screenshot of http://localhost:3000/login"
```

### B. Test Page Load
```
"Check if http://localhost:3000 loads successfully"
```

### C. Element Detection
```
"Navigate to http://localhost:3000/login and tell me what elements are on the page"
```

### D. Form Interaction
```
"Fill out the login form at http://localhost:3000/login with test data"
```

### E. Full Flow Test
```
"Test the complete login flow at http://localhost:3000/login"
```

---

## Step 4: Advanced Tests

### Visual Regression
```
"Take screenshots of all pages in http://localhost:3000 and compare them"
```

### Accessibility Audit
```
"Run an accessibility check on http://localhost:3000 and report any issues"
```

### Performance Check
```
"Measure the page load time for http://localhost:3000"
```

### Multi-Browser Test
```
"Test the login page on Chrome, Firefox, and Safari"
```

---

## Step 5: Integration with Your E2E Tests

You already have tests in `e2e/authentication.spec.ts`. The MCP can help:

### Run Specific Test
```
"Run the login flow test from e2e/authentication.spec.ts"
```

### Debug Failed Test
```
"I have a failing test, help me debug it with Playwright"
```

### Create New Test
```
"Create a Playwright test for testing the production order creation flow"
```

---

## What Playwright MCP Can Do

- ✅ Navigate to URLs
- ✅ Take screenshots
- ✅ Fill forms and click buttons
- ✅ Extract text and data
- ✅ Run accessibility audits
- ✅ Test across browsers
- ✅ Measure performance
- ✅ Debug failing tests
- ✅ Generate test reports

---

## Troubleshooting

### "Server not responding"
→ Restart Cursor completely (Cmd+Q and reopen)

### "Connection refused"
→ Make sure your dev server is running: `npm run dev`

### "Browser not found"
→ Run: `npx playwright install`

### "Tests timeout"
→ Increase timeout in `playwright.config.ts`

---

## Example Use Cases for Your Project

### 1. Verify Authentication
```
"Test if users can login with valid OTP codes"
```

### 2. Check Production Orders
```
"Navigate to the orders page and verify it shows order data"
```

### 3. Test Recipe Generation
```
"Fill out a recipe form and verify AI suggestions appear"
```

### 4. Mobile Testing
```
"Test the authentication flow on mobile viewport"
```

---

## Next Steps

1. ✅ Install Playwright MCP
2. ✅ Add to configuration
3. ✅ Restart Cursor
4. ⏳ Test with commands above
5. ⏳ Integrate into your workflow

---

**Last Updated**: 2025-01-31  
**Status**: Ready to use ✅


