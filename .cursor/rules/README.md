# Cursor AI Rules

This directory contains cursor AI rules that guide AI assistant behavior when working on this project.

## 📋 Rule Files Overview

### Core Rules (Always Applied)

1. **`development-workflow.mdc`** 🚨 CRITICAL - Development Workflow
   - **Build testing before git operations** (MANDATORY)
   - Git commit workflow with conventional commits
   - Code review checklist
   - Debugging build errors guide
   - Continuous integration practices

2. **`design-system.mdc`** 🆕 CRITICAL - Unified Design System
   - Component-first architecture (IconContainer, Card, ModelBadge)
   - Semantic color system (primary, success, danger)
   - Design tokens (colors, spacing, shadows, animations)
   - Apple HIG standards (300ms, 44pt touch targets)
   - Accessibility (WCAG AA, focus ring, motion preferences)

3. **`architecture.mdc`** - System Architecture & Tech Stack
   - Next.js 14 App Router conventions
   - File structure and organization
   - Code quality standards (max 250 lines, no `any` types)
   - API response formats
   - Performance guidelines

4. **`liquidglass.mdc`** - Liquid Glass UI Effects
   - iOS 26 Liquid Glass design language
   - Existing glass classes from globals.css
   - Integration with design system
   - Accessibility requirements

5. **`ai-integration.mdc`** ⚠️ CRITICAL - AI Configuration & Optimization
   - AI model configuration (GPT-5, Claude, Grok)
   - **NO reasoning/thinking parameters** policy
   - **AI Model Parameter Optimization** guidelines
   - Task-specific parameter selection (creative, analytical, consensus, interactive)
   - Cost optimization strategies and performance monitoring
   - API integration patterns and context management

6. **`data-validation.mdc`** - Form Validation
   - React Hook Form + Zod patterns
   - Validation schemas
   - Error message guidelines (Traditional Chinese)
   - Common validation rules

7. **`database.mdc`** - Database & Prisma ORM
   - Prisma client usage (singleton from lib/prisma.ts)
   - Query optimization (select, pagination)
   - Migration procedures
   - Schema best practices

8. **`authentication.mdc`** - Security & Auth
   - Current localStorage-based auth
   - Security best practices (timing-safe comparison)
   - Environment variable usage
   - System limitations

## 🎯 Why Multiple Rule Files?

✅ **Focused Context**: Each file covers one specific domain  
✅ **Easier Maintenance**: Update one area without affecting others  
✅ **Better Organization**: Clear separation of concerns  
✅ **Selective Application**: Can disable specific rules if needed

## ⚠️ Most Critical Rules

### 🚨 CRITICAL REQUIREMENTS - ALWAYS FOLLOW
1. **ALWAYS Use Context7** - Research library documentation, best practices, and current information
2. **ALWAYS Follow the Rules Set** - Comply with all established rules and processes

### 🚨 Priority 1: `development-workflow.mdc` - BUILD TESTING MANDATORY
**Why critical:**
- **Requires build testing before EVERY commit/push**
- Prevents broken code from reaching GitHub
- Ensures TypeScript compilation succeeds
- Catches type errors before deployment
- Documents standard git workflow

**Key policy**: ALWAYS run `npm run build` before committing or pushing code.

### 🚨 Priority 2: `design-system.mdc` - UNIFIED DESIGN SYSTEM
**Why critical:**
- Enforces component-first architecture
- Prevents hardcoded styles and one-off classes
- Ensures "change once, update everywhere" pattern
- Maintains Apple HIG standards across all pages
- Critical for visual consistency

**Key policy**: Always use unified components (IconContainer, Card, ModelBadge). Never hardcode colors or create custom icon containers.

**✅ Achievement Unlocked (2025-10-17):**
- 100% color system unified (528+ → 0 hardcoded colors)
- 56 files migrated to semantic colors
- Zero technical debt remaining

### 🚨 Priority 3: `ai-integration.mdc` - AI CONFIGURATION & OPTIMIZATION
**Why critical:**
- Documents the decision to remove all reasoning/thinking parameters
- Prevents accidental re-introduction of complexity
- Defines current AI model usage patterns with optimized parameters
- Ensures consistency across AI features
- **NEW**: Comprehensive AI model parameter optimization guidelines
- **NEW**: Task-specific parameter selection for maximum performance and cost efficiency

**Key policy**: All AI models run as-is without manual reasoning configuration, with task-specific parameter optimization for 15-50% cost reduction.

## 📝 How to Use

These rules are automatically applied by Cursor AI when:
- Writing new code
- Modifying existing code
- Answering questions about the project
- Debugging issues

You don't need to do anything - Cursor reads these files automatically.

## 🔄 Updating Rules

When project patterns change:
1. Update the relevant `.mdc` file
2. Keep rules concise and actionable
3. Use code examples where helpful
4. Test that Cursor follows the new rules

## 📚 Related Documentation

- Main README: `/README.md`
- Development Guide: `/DEVELOPMENT_GUIDE.md`
- API Documentation: `/API_DOCUMENTATION.md`
- Quick Reference: `/QUICK_REFERENCE.md`

---

## 🎉 Recent Updates

### October 17, 2025 - Design System 100% Completion
- ✅ Complete color system unification (528+ migrations)
- ✅ All 56 files migrated to semantic colors
- ✅ Zero hardcoded colors remaining
- ✅ Full Apple HIG compliance achieved
- 📚 New documentation: `DESIGN_SYSTEM_COMPLETION_REPORT.md`, `MIGRATION_GUIDE.md`

### December 2024 - AI Model Parameter Optimization
- ✅ Comprehensive AI model parameter optimization across 8 endpoints
- ✅ Task-specific parameter selection (creative, analytical, consensus, interactive)
- ✅ Cost optimization strategies achieving 15-50% reduction
- ✅ Performance monitoring and quality gates implementation
- ✅ AI integration rules updated with optimization guidelines
- 📚 New documentation: `AI_MODEL_OPTIMIZATION_ANALYSIS.md`, `AI_OPTIMIZATION_SUMMARY.md`

---

**Last Updated**: October 17, 2025

