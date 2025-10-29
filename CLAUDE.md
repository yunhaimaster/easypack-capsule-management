# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Easy Health Capsule Management System** - A production-grade pharmaceutical manufacturing management platform built with Next.js 14, TypeScript, Prisma, and PostgreSQL. The system manages production orders, work orders, capsulation recipes, and includes AI-powered features for granulation analysis, recipe generation, and marketing assistance.

## Essential Commands

### Development
```bash
npm run dev              # Start development server
npm run build:local      # Local build (generates Prisma client + builds)
npm run lint             # Run ESLint
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes to database
npm run db:migrate       # Create and run migration
npm run db:deploy        # Deploy migrations (production)
```

### Testing
```bash
npm test                 # Run Jest unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # E2E tests with UI
npm run test:e2e:debug   # Debug E2E tests
```

### Build & Deploy
```bash
npm run build            # Production build (includes migration deployment + Prisma generation)
npm run check            # Lint + build validation
npm start                # Start production server
```

### Critical Pre-Commit Workflow
**ALWAYS run before committing:**
```bash
npm run build            # Must pass before git commit/push
```

## Architecture Overview

### Core Stack
- **Frontend**: Next.js 14 App Router, React 19, TypeScript (strict mode)
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: PostgreSQL (production), migrations managed via Prisma
- **AI Integration**: OpenRouter API (GPT-5, Claude Sonnet 4.5, Grok 4, GPT-5 Mini)
- **Styling**: Tailwind CSS with custom liquid glass design system
- **Authentication**: OTP-based auth via Twilio SMS + JWT sessions
- **Deployment**: Vercel with optimized build configuration

### Database Architecture

The system uses a sophisticated multi-entity schema:

1. **Authentication System**
   - `User` (role-based: EMPLOYEE, MANAGER, ADMIN)
   - `Session` (JWT-based with HTTP-only cookies)
   - `TrustedDevice` (device fingerprinting for trusted logins)
   - `OtpAttempt` (rate limiting tracking)
   - `AuditLog` (comprehensive audit trail for all actions)

2. **Production Management**
   - `ProductionOrder` (legacy system, being migrated)
   - `Ingredient` (formula components with customer specifications)
   - `OrderWorklog` (production time tracking)

3. **Unified Work Order System** (Primary System)
   - `UnifiedWorkOrder` (main work order entity with status workflow)
   - `CapsulationOrder` (capsule-specific production details)
   - `CapsulationIngredient` (ingredients for capsulation orders)
   - `CapsulationWorklog` (work time tracking)
   - Status flow: NULL (ongoing) → PAUSED → CANCELLED/COMPLETED
   - Work types: PACKAGING, PRODUCTION, PRODUCTION_PACKAGING, WAREHOUSING

4. **Recipe Library**
   - `RecipeLibrary` (reusable formulas with AI analysis)
   - Deduplication via SHA-256 fingerprinting
   - AI-powered efficacy analysis and optimization suggestions
   - Recipe types: "production" (from orders) vs "template" (manual)

5. **AI & Compliance** (v2.0 features)
   - `AIRecipe` (AI-generated formulations)
   - `ProductEfficacy` (ingredient efficacy database)
   - `IngredientPrice` (pricing data for cost analysis)
   - `LegacyWorkOrder` (ISO compliance work orders)
   - `QCFile` (quality control documentation)
   - `AdCopy` (marketing content generation)

### Key Design Patterns

**Unified Component System**
The codebase enforces a strict component hierarchy to ensure design consistency:
- Text: `Text.Primary`, `Text.Secondary`, `Text.Tertiary`, `Text.Muted`
- Containers: `Container.Page`, `Container.Section`, `Container.Content`
- Cards: `Card` with liquid glass variants (`liquid-glass-card`, `liquid-glass-card-elevated`)
- Tables: `TableWrapper`, `TableHeader`, `TableBody` from `table-unified`
- Icons: `IconContainer` for consistent icon backgrounds

**Never use hardcoded Tailwind colors directly** - always use semantic design tokens or unified components.

**Authentication Flow**
1. User requests OTP via phone number (E.164 format)
2. Twilio sends SMS with 6-digit code
3. OTP verification creates JWT session
4. Device fingerprinting enables trusted device bypass
5. All auth events logged to `AuditLog`

**AI Integration Pattern**
All AI features use OpenRouter API with model-specific configurations:
- **Smart AI & Order AI**: `gpt-5-mini` (fast Q&A, temp: 0.4-0.6)
- **Granulation Analyzer**: Parallel analysis with `gpt-5`, `claude-sonnet-4.5`, `grok-4` (temp: 0.2-0.4)
- **Recipe Generator**: Same parallel models (temp: 0.6-0.8 for creativity)
- **Consensus Tasks**: `claude-sonnet-4.5` (temp: 0.1-0.2 for consistency)

**Critical AI Rules**:
- NEVER add reasoning parameters (`reasoning_enabled`, `thinking_enabled`, etc.)
- GPT-5 has built-in reasoning that activates automatically
- Always use streaming responses (Server-Sent Events)
- Implement `AbortController` for cancellable requests
- Show loading states with `AIThinkingIndicator` (simple spinner only)

### File Structure Conventions

```
src/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── ai/                   # AI endpoints (analyze, generate, chat)
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── orders/               # Production order CRUD
│   │   ├── recipes/              # Recipe library management
│   │   └── work-orders/          # Work order management
│   ├── orders/[id]/              # Production order pages
│   ├── work-orders/[id]/         # Work order detail/edit
│   ├── recipe-library/           # Recipe management UI
│   ├── granulation-analyzer/     # AI granulation analysis
│   └── ai-recipe-generator/      # AI recipe generation
├── components/
│   ├── ui/                       # Unified design system components
│   ├── auth/                     # Authentication components
│   ├── admin/                    # Admin-only components
│   └── marketing/                # Marketing assistant components
├── lib/
│   ├── ai/                       # AI utilities and prompts
│   ├── auth/                     # Auth logic (session, device, RBAC)
│   ├── export/                   # CSV/XLSX export utilities
│   ├── import/                   # Data import parsers
│   ├── ui/                       # Design tokens and animations
│   └── validations/              # Zod schemas for validation
└── prisma/
    ├── schema.prisma             # Database schema
    └── migrations/               # Database migrations
```

## Development Rules

### Mandatory Component Usage

**ALWAYS use unified components instead of raw HTML/Tailwind:**

```tsx
// ❌ WRONG - Hardcoded colors
<div className="bg-white dark:bg-gray-800 rounded-lg">
  <h3 className="text-gray-900">Title</h3>
  <p className="text-gray-600">Content</p>
</div>

// ✅ CORRECT - Unified components
<Card className="liquid-glass-card">
  <CardContent>
    <Text.Primary>Title</Text.Primary>
    <Text.Secondary>Content</Text.Secondary>
  </CardContent>
</Card>
```

### Dark Mode & Design System

- Liquid glass aesthetic with `backdrop-filter` blur effects
- Elevation system: `elevation-0` through `elevation-4`
- All colors must have dark mode variants
- Use semantic color tokens from `src/lib/ui/design-tokens.ts`
- Apple HIG compliance: 300ms animations, 44x44px touch targets

### TypeScript Standards

- Strict mode enabled (`tsconfig.json`)
- **No `any` types** - always define proper interfaces/types
- Components should be under 250 lines (split if longer)
- API responses use standardized `ApiResponse<T>` type
- All database operations use Prisma-generated types

### Security & Logging

**NEVER log sensitive data:**
- ❌ Phone numbers, emails, session tokens, JWT, cookies
- ❌ Passwords, OTP codes, API keys
- ❌ User PII (addresses, payment info)

```typescript
// ❌ BAD
console.log('[Auth] User phone:', phoneE164)

// ✅ GOOD
console.log('[Auth] OTP sent successfully')
```

### Build Testing Requirement

**Before ANY commit or push:**
```bash
npm run build  # Must pass with zero errors
```

Build failures MUST be fixed before committing. Common issues:
- TypeScript type errors
- Missing imports or components
- Prisma client out of sync

### Git Commit Format

```bash
# Use conventional commits with emojis
✨ feat: add recipe search functionality
🐛 fix: resolve authentication timeout
♻️ refactor: unify card component variants
🎨 style: update dark mode colors
📝 docs: update API documentation
✅ test: add E2E tests for login flow
```

## AI Model Configuration

### Parameter Optimization by Task Type

**Creative Tasks** (Recipe Generation, Marketing):
```typescript
{
  temperature: 0.6-0.8,
  top_p: 0.9-0.95,
  frequency_penalty: 0.1-0.2,
  presence_penalty: 0.1,
  max_tokens: 6000-8000
}
```

**Analytical Tasks** (Granulation, Ingredient Analysis):
```typescript
{
  temperature: 0.2-0.4,
  top_p: 0.9-0.95,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
  max_tokens: 4000-8000
}
```

**Interactive Tasks** (Chat, Q&A):
```typescript
{
  temperature: 0.4-0.6,
  top_p: 0.9-0.95,
  frequency_penalty: 0.1,
  presence_penalty: 0.1,
  max_tokens: 800-2000
}
```

### Model Selection Guidelines

- **GPT-5 Mini**: General Q&A, fast responses, cost-effective
- **GPT-5**: Complex analysis, deep reasoning (built-in, no config needed)
- **Claude Sonnet 4.5**: Consensus tasks, synthesis, comprehensive analysis
- **Grok 4**: Creative perspectives, alternative approaches
- **Parallel Analysis**: Run all 3 models (GPT-5, Claude, Grok) for critical decisions

## Important Implementation Notes

### Recipe Fingerprinting
Recipes are deduplicated using SHA-256 hashing based on:
- Customer name
- Product name
- Ingredient combinations (normalized)

Implementation: `src/lib/recipe-fingerprint.ts`

### Work Order Status Workflow
- Default state: `NULL` (ongoing work, managed by checkboxes)
- Explicit states: `PAUSED`, `CANCELLED`, `COMPLETED`
- Status changes are audit-logged with timestamp and user

### Authentication System
- OTP rate limiting: Max 3 attempts per phone/IP in 5 minutes
- Session expiry: 30 days (configurable)
- Trusted devices: 90-day validity
- Device fingerprinting: SHA-256 hash of user agent + IP + timestamp

### Database Migrations
All schema changes MUST go through Prisma migrations:
```bash
npx prisma migrate dev --name descriptive_name
```

Never modify `schema.prisma` without creating a migration.

## Performance Targets

- **Initial Load**: < 3s (3G connection)
- **Subsequent Pages**: < 1s
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Bundle Size**: < 200KB First Load JS
- **API Response**: < 500ms (non-AI endpoints)
- **AI Streaming**: First token < 1s

## Common Patterns

### API Route Structure
```typescript
export async function GET(request: Request) {
  try {
    // 1. Validate session
    const session = await validateSession(request)
    if (!session) return unauthorized()

    // 2. Parse/validate input
    const params = await validateInput(request)

    // 3. Database operation
    const data = await prisma.model.findMany({ where: params })

    // 4. Return standardized response
    return success(data)
  } catch (error) {
    console.error('[API] Operation failed', { error: error.message })
    return serverError('Operation failed')
  }
}
```

### Client-Side Data Fetching
Use React Query (TanStack Query) for all client-side data:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['orders', orderId],
  queryFn: () => fetchOrder(orderId),
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

### Form Validation
Use React Hook Form + Zod schemas:
```typescript
const schema = z.object({
  customerName: z.string().min(1, 'Required'),
  quantity: z.number().int().positive(),
})

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
})
```

## References

For detailed guidance on specific topics, see:
- `.cursorrules` - Complete development rules and MCP integration guide
- `rules.md` - Detailed design system and architecture standards
- `prisma/schema.prisma` - Full database schema documentation
- `src/components/ui/` - Unified component implementations
- `src/lib/ai/parameter-optimizer.ts` - AI model configuration helper

## Quick Reference

| Task | Primary Tool/File |
|------|------------------|
| Add new page | `src/app/[page]/page.tsx` |
| Create API endpoint | `src/app/api/[endpoint]/route.ts` |
| Database changes | `prisma/schema.prisma` + migrate |
| UI components | `src/components/ui/` |
| Auth logic | `src/lib/auth/` |
| AI integration | `src/lib/ai/` + `src/app/api/ai/` |
| Validation schemas | `src/lib/validations/` |
| Type definitions | Co-located with implementation |
