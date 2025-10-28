# Easy Health Capsule Management System - Development Rules

## 🎯 Project Overview
**Easy Health Capsule Management System** - A comprehensive production order and recipe management platform with AI-powered features, built with Next.js 14, TypeScript, and Tailwind CSS.

## 🏗️ Architecture Standards

### Core Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (production), SQLite (development)
- **AI**: Multiple models via OpenRouter (GPT-5, Claude Sonnet 4.5, Grok 4, GPT-5 Mini)
- **Styling**: Tailwind CSS with custom design system
- **Deployment**: Vercel

### Design System Architecture
- **Unified Components**: All UI elements use standardized components
- **Semantic Colors**: Use design tokens instead of hardcoded colors
- **Dark Mode**: Liquid glass aesthetic with proper elevation hierarchy
- **Accessibility**: WCAG AA compliance (4.5:1 contrast ratio minimum)

## 🎨 Design System Rules

### MANDATORY: Unified Component Usage
**CRITICAL RULE**: All new code MUST use standardized components. This is NON-NEGOTIABLE.

#### Required Component Mapping
| When you need... | Use this component | Import from |
|------------------|-------------------|-------------|
| Text elements | `Text.Primary`, `Text.Secondary`, `Text.Tertiary`, `Text.Muted` | `@/components/ui/text` |
| Page containers | `Container.Page`, `Container.Section`, `Container.Content` | `@/components/ui/container` |
| Cards/surfaces | `Card`, `CardContent`, `CardHeader` | `@/components/ui/card` |
| Buttons | `Button` | `@/components/ui/button` |
| Badges/tags | `Badge` | `@/components/ui/badge` |
| Tables | `Table`, `TableWrapper`, `TableHeader`, etc. | `@/components/ui/table-unified` |
| Icons with background | `IconContainer` | `@/components/ui/icon-container` |
| Modals/dialogs | `LiquidGlassModal`, `Dialog` | `@/components/ui/` |

#### ❌ NEVER Do This:
```tsx
// ❌ WRONG - Hardcoded colors
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <span className="bg-blue-500 text-white px-3 py-1 rounded-full">Badge</span>
</div>

// ❌ WRONG - Manual dark mode handling
<div className="bg-white/60 dark:bg-gray-900/60">Content</div>

// ❌ WRONG - Raw HTML elements
<h3 className="text-neutral-800">Title</h3>
<p className="text-neutral-600">Content</p>
```

#### ✅ ALWAYS Do This:
```tsx
// ✅ CORRECT - Use unified components
<Card className="liquid-glass-card liquid-glass-card-elevated">
  <CardContent className="p-6">
    <Badge variant="primary">Badge</Badge>
    <Text.Primary>Title</Text.Primary>
    <Text.Secondary>Content</Text.Secondary>
  </CardContent>
</Card>
```

### Dark Mode Standards
- **Liquid Glass Aesthetic**: Use backdrop-filter for authentic glass effects
- **Elevation System**: Use `elevation-0` through `elevation-4` for proper visual hierarchy
- **Semantic Colors**: All colors must have dark mode variants
- **No Hardcoded Colors**: Never use `bg-white`, `text-gray-*`, etc. without dark mode variants

### Color System (Semantic)
```tsx
// Text colors
text-neutral-800 dark:text-white/95    // Primary text
text-neutral-600 dark:text-white/75    // Secondary text
text-neutral-500 dark:text-white/65    // Tertiary text
text-neutral-400 dark:text-white/55    // Muted text

// Background colors
bg-surface-primary dark:bg-elevation-0  // Page background
bg-surface-secondary dark:bg-elevation-1 // Card background
bg-primary-500 dark:bg-primary-500      // Brand colors
```

## 🔧 Development Workflow

### Build Testing - CRITICAL REQUIREMENT
**RULE**: Before committing or pushing to GitHub, ALWAYS run a local build test.

#### When to Build Test
- ✅ Before any `git commit` or `git push`
- ✅ After making multiple changes (3+ files modified)
- ✅ After refactoring components or types
- ✅ After adding new dependencies
- ✅ After modifying TypeScript interfaces/types

#### Build Test Command
```bash
npm run build
```

#### On Build Failure
1. **DO NOT commit or push**
2. Read error messages carefully
3. Fix TypeScript/type errors first
4. Fix missing imports or components
5. Re-run build test
6. Only proceed when build succeeds

### Git Commit Standards
```bash
# Standard workflow
npm run build                    # Test build first
git add -A
git commit -m "✨ feat: add feature X"
git push origin main
```

#### Commit Message Format
```bash
# Features
git commit -m "✨ feat: add new IconContainer component"
git commit -m "🎨 style: refactor homepage design"

# Fixes
git commit -m "🐛 fix: resolve TypeScript build error"
git commit -m "🐛 fix: correct missing import in page.tsx"

# Refactoring
git commit -m "♻️ refactor: unify card components"
git commit -m "🔧 refactor: update design tokens"
```

## 🎯 AI Model Integration

### Current Models
- **Smart AI & Order AI**: `openai/gpt-5-mini` (chat/Q&A)
- **Granulation Analyzer**: `openai/gpt-5`, `anthropic/claude-sonnet-4.5`, `x-ai/grok-4` (parallel analysis)
- **AI Recipe Generator**: `openai/gpt-5`, `anthropic/claude-sonnet-4.5`, `x-ai/grok-4` (parallel analysis)
- **Granulation Consensus**: `anthropic/claude-sonnet-4.5` (cross-analysis)

### Critical Rules - NO REASONING PARAMETERS
⚠️ **IMPORTANT**: All AI models run as-is without any reasoning/thinking configuration.

**NEVER add these parameters:**
- ❌ `reasoning_enabled`
- ❌ `thinking_enabled`
- ❌ `thinking_budget`
- ❌ `enableReasoning`
- ❌ `supportsReasoning`
- ❌ `deepThinking`

### AI Parameter Optimization
```typescript
// Creative Tasks (Recipe Generation, Marketing Content)
{
  temperature: 0.6-0.8,
  top_p: 0.9-0.95,
  frequency_penalty: 0.1-0.2,
  presence_penalty: 0.1
}

// Analytical Tasks (Granulation Analysis, Ingredient Analysis)
{
  temperature: 0.2-0.4,
  top_p: 0.9-0.95,
  frequency_penalty: 0.0,
  presence_penalty: 0.0
}

// Interactive Tasks (Chat, Suggestions, Q&A)
{
  temperature: 0.4-0.6,
  top_p: 0.9-0.95,
  frequency_penalty: 0.1,
  presence_penalty: 0.1
}
```

## 🔒 Security Standards

### Authentication System
- **OTP-based authentication** via Twilio SMS
- **JWT sessions** with HTTP-only cookies
- **PostgreSQL database** for user management
- **Role-based access control** (ADMIN, EMPLOYEE roles)
- **Rate limiting** on OTP requests
- **Audit logging** for all auth events

### Security Logging Rules
**⚠️ NEVER Log Sensitive Data**

**Prohibited in console.log/error/warn:**
- ❌ Phone numbers
- ❌ Email addresses
- ❌ Session tokens or JWT
- ❌ Cookies or cookie headers
- ❌ Passwords or OTP codes
- ❌ API keys or secrets
- ❌ User PII (addresses, payment info)

**Safe Logging Patterns:**
```typescript
// ❌ BAD - Exposes sensitive data
console.log('[Auth] User phone:', phoneE164)
console.log('[Auth] Session token:', token)

// ✅ GOOD - No sensitive data
console.log('[Auth] OTP sent successfully')
console.log('[Auth] Session created')
```

## 📊 Quality Assurance

### Performance Benchmarks
- **Initial Load**: < 3 seconds (3G connection)
- **Subsequent Pages**: < 1 second
- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Bundle Size**: < 200KB First Load JS

### Lighthouse Scores (Minimum)
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 95
- **SEO**: > 90

### Code Quality Checklist
- [ ] No `any` types used
- [ ] All interfaces/types properly defined
- [ ] Components under 250 lines
- [ ] Use design tokens (no hardcoded colors)
- [ ] Use unified components
- [ ] Responsive design implemented
- [ ] Accessibility attributes added
- [ ] No console.log of PII, phone numbers, tokens, or session data

## 🛠️ Audit Tools

### Available Scripts
```bash
# Unified components and dark mode audit
node scripts/improved-audit.js

# Text contrast audit
node scripts/detailed-contrast-audit.js

# Comprehensive fix for remaining issues
node scripts/final-comprehensive-fix.js
```

### Audit Standards
- **CRITICAL**: 0 text colors without dark mode variants
- **HIGH**: 0 manual dark mode classes and hardcoded backgrounds
- **MEDIUM**: 0 raw HTML elements that should use unified components
- **TOTAL**: 0 violations for 100% perfection

## 🎉 Achievement Status

### ✅ Completed (100% Perfection Achieved)
- **Dark Mode Redesign**: Liquid glass aesthetic with proper elevation
- **Component Unification**: Unified Text, Container, Badge, Table components
- **Text Contrast**: WCAG AA compliance (4.5:1 ratio)
- **Audit Compliance**: 0 CRITICAL, 0 HIGH, 0 MEDIUM issues
- **Build Stability**: All components pass TypeScript and build tests
- **Security**: Proper audit logging without sensitive data exposure

### 🎯 Key Principles
1. **Component-First Architecture**: Use unified components instead of hardcoded classes
2. **Semantic Naming**: Use semantic color names (primary, success, danger) not specific colors
3. **Apple HIG Standards**: 300ms animations, 44x44px touch targets, smooth transitions
4. **Accessibility First**: WCAG AA compliance, proper contrast ratios, keyboard navigation
5. **Performance Optimized**: Fast load times, efficient bundle sizes, optimized AI parameters

## 📚 Documentation
- **Design System**: `docs/DESIGN_SYSTEM.md`
- **Migration Guide**: `docs/MIGRATION_GUIDE.md`
- **Dark Mode Philosophy**: `docs/DARK_MODE_V1_DOCUMENTATION.md`
- **Component Examples**: `src/app/unified-demo/page.tsx`

---

**Last Updated**: 2025-01-24  
**Version**: 1.0 (100% Perfection Achieved)  
**Status**: Production Ready ✅
