# 🎯 Cursor AI Rules Guide

## ✅ What Was Done

Created a comprehensive, modular cursor rules structure to guide AI assistant behavior across all aspects of the Easy Health project.

### Files Created/Updated

#### New Rule Files (`.cursor/rules/`)
1. **`architecture.mdc`** - System architecture & tech stack
2. **`ai-integration.mdc`** - AI model configuration (CRITICAL)
3. **`data-validation.mdc`** - Form validation patterns
4. **`database.mdc`** - Prisma ORM best practices
5. **`authentication.mdc`** - Security guidelines
6. **`README.md`** - Rule files documentation

#### Updated
- **`liquidglass.mdc`** - Fixed duplicates, enhanced with accessibility

---

## 📚 Rule Files Overview

### 1️⃣ `architecture.mdc` - System Foundation
**What it covers:**
- Tech stack (Next.js 14, React, TypeScript, Prisma, PostgreSQL)
- File structure conventions
- Code quality rules (max 250 lines per component)
- API response format standards
- Performance guidelines

**Key Rules:**
- Use App Router (not Pages Router)
- Server Components by default
- TypeScript strict mode - no `any` types
- Consistent error handling
- Paginate large datasets (limit: 30)

---

### 2️⃣ `liquidglass.mdc` - Design System
**What it covers:**
- iOS 26 Liquid Glass design language
- CSS implementation patterns
- Responsive design (mobile-first)
- Accessibility requirements (WCAG 2.1 AA)

**Key Rules:**
- Use existing `.liquid-glass-*` classes
- Backdrop blur for glass effects
- Smooth transitions (200-300ms)
- Minimum 44x44px touch targets
- 4.5:1 contrast ratio for text

---

### 3️⃣ `ai-integration.mdc` - AI Configuration ⚠️ CRITICAL
**What it covers:**
- Current AI model usage (GPT-5, Claude, Grok, GPT-5 Mini)
- **NO reasoning parameters** policy
- API integration patterns
- Context management
- Error handling

**Key Rules:**
⚠️ **NEVER add these parameters:**
- ❌ `reasoning_enabled`
- ❌ `thinking_enabled`
- ❌ `enableReasoning`
- ❌ `supportsReasoning`

**Why this is critical:**
- Prevents re-introduction of removed complexity
- Documents the simplified AI architecture
- Ensures all models run as-is

**Model assignments:**
- Smart AI & Order AI: `openai/gpt-5-mini`
- Granulation/Recipe: `openai/gpt-5`, `anthropic/claude-sonnet-4.5`, `x-ai/grok-4`
- Consensus: `anthropic/claude-sonnet-4.5`

---

### 4️⃣ `data-validation.mdc` - Form Validation
**What it covers:**
- React Hook Form + Zod patterns
- Validation schemas
- Error message guidelines
- Common validation rules

**Key Rules:**
- Use `zodResolver` for all forms
- Traditional Chinese error messages
- Validate on blur, submit on form
- Sanitize strings (trim whitespace)
- Create reusable validators

**Common patterns:**
```typescript
const schema = z.object({
  customerName: z.string().min(1, "客戶名稱為必填項").max(100),
  ingredients: z.array(...).min(1, "至少需要一個原料")
})
```

---

### 5️⃣ `database.mdc` - Prisma Best Practices
**What it covers:**
- Prisma client usage
- Query optimization
- Migration procedures
- Schema best practices

**Key Rules:**
- Use singleton from `lib/prisma.ts` (never create new instances)
- Select only needed fields
- Add indexes for frequently queried fields
- Use transactions for related operations
- Paginate with `skip` and `take`

**Efficient query example:**
```typescript
const orders = await prisma.productionOrder.findMany({
  select: { id: true, customerName: true },
  take: 30,
  orderBy: { createdAt: 'desc' }
})
```

---

### 6️⃣ `authentication.mdc` - Security
**What it covers:**
- Current localStorage-based auth
- Security best practices
- Environment variable usage
- System limitations

**Key Rules:**
- Never hardcode passwords
- Use environment variables (`LOGIN`)
- Timing-safe password comparison
- Generic error messages
- Clear limitations documentation

**Current system:**
- Simple shared login code
- localStorage for auth state
- Designed for internal use only
- NOT suitable for sensitive production data

---

## 🎯 Why Modular Rules?

### Before (Single File)
- ❌ One large, unfocused file
- ❌ Duplicate content
- ❌ Hard to maintain
- ❌ Only covered UI

### After (Multiple Files)
- ✅ Focused, domain-specific rules
- ✅ No duplication
- ✅ Easy to update individual areas
- ✅ Covers all aspects: UI, data, AI, security, architecture

---

## 🚨 Most Important Rule

**`ai-integration.mdc` is the most critical file** because:

1. Documents the recent refactor to remove reasoning parameters
2. Prevents accidental re-introduction
3. Defines current AI architecture
4. Ensures consistency across all AI features

**This file prevents the AI from:**
- Adding back reasoning toggles
- Creating deep thinking checkboxes
- Adding `supportsReasoning` flags
- Configuring manual reasoning parameters

---

## 📖 How Cursor Uses These Rules

Cursor AI automatically:
1. Reads all `.mdc` files in `.cursor/rules/`
2. Applies rules when writing/modifying code
3. Follows guidelines when answering questions
4. References rules when debugging

**You don't need to do anything** - Cursor handles it automatically.

---

## 🔄 Updating Rules

When project patterns change:

1. Identify which rule file to update
2. Edit the `.mdc` file
3. Keep rules concise and actionable
4. Use code examples
5. Commit changes to git

**Example:**
```bash
# If AI model changes
vim .cursor/rules/ai-integration.mdc

# If design patterns change
vim .cursor/rules/liquidglass.mdc
```

---

## 📊 Summary

### What You Have Now
- 6 focused rule files covering all aspects
- 1 README explaining the structure
- Clear documentation of current decisions
- Prevention of architectural drift

### Benefits
1. **Consistency** - AI follows project patterns
2. **Prevention** - Stops re-introduction of removed features
3. **Documentation** - Rules document current architecture
4. **Maintainability** - Easy to update specific areas
5. **Quality** - Enforces best practices

---

## 🎓 Best Practices Going Forward

### Do's ✅
- Reference these rules when discussing architecture
- Update rules when major patterns change
- Keep rules concise and specific
- Use code examples in rules

### Don'ts ❌
- Don't create overlapping rules
- Don't make rules too generic
- Don't forget to update after major refactors
- Don't ignore the critical AI integration rules

---

## 📝 Next Steps

1. ✅ Rules are now active in Cursor
2. ✅ Changes committed and pushed to GitHub
3. 💡 Monitor that AI follows these rules
4. 💡 Update rules when patterns evolve

**The AI will now automatically follow these guidelines!** 🎉

---

**Created**: October 2025  
**Last Updated**: After AI reasoning parameters removal refactor

