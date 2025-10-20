# Documentation Standards

## Philosophy

Document for your future self. If it's not obvious in 6 months, document it now. Focus on public APIs, complex logic, and architectural decisions.

## When to Document

### MUST Document

✅ **Public API functions and components**
✅ **Complex algorithms or business logic**
✅ **Non-obvious workarounds**
✅ **Architectural decisions**
✅ **Security-critical code**
✅ **Performance optimizations**

### SHOULD Document

⚡ **Reusable utility functions**
⚡ **Form validation schemas**
⚡ **API route handlers**
⚡ **Database schema changes**
⚡ **Environment variable requirements**

### OPTIONAL Documentation

⭕ **Self-explanatory code**
⭕ **Standard patterns**
⭕ **Simple internal helpers**
⭕ **Trivial changes**

## Documentation Types

### 1. JSDoc for Public APIs

**Template**:
```typescript
/**
 * Brief description of what the function does
 * 
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 * 
 * @example
 * ```typescript
 * const result = myFunction('example')
 * ```
 */
export function myFunction(paramName: string): ReturnType {
  // implementation
}
```

**Example**:
```typescript
/**
 * Validates production order data against schema
 * 
 * @param data - Raw order data from form
 * @returns Validated order object
 * @throws {ValidationError} When data fails schema validation
 * 
 * @example
 * ```typescript
 * const order = validateOrder(formData)
 * ```
 */
export function validateOrder(data: unknown): ProductionOrder {
  // implementation
}
```

### 2. Component Documentation

**Template**:
```typescript
/**
 * Brief component description
 * 
 * @component
 * @example
 * ```tsx
 * <ComponentName
 *   prop1="value"
 *   prop2={true}
 * />
 * ```
 */

interface ComponentProps {
  /** Description of prop */
  prop1: string
  /** Description of prop with default */
  prop2?: boolean // default: false
}

export function ComponentName({ prop1, prop2 = false }: ComponentProps)
```

**Example**:
```typescript
/**
 * Displays AI model badge with appropriate styling
 * 
 * @component
 * @example
 * ```tsx
 * <ModelBadge model="gpt" />
 * <ModelBadge model="claude" size="sm" />
 * ```
 */

interface ModelBadgeProps {
  /** AI model identifier */
  model: 'gpt' | 'claude' | 'grok' | 'gpt-mini' | 'deepseek'
  /** Badge size */
  size?: 'sm' | 'md' // default: md
}

export function ModelBadge({ model, size = 'md' }: ModelBadgeProps) {
  // implementation
}
```

### 3. Architectural Decision Records (ADR)

**Lightweight Template**:
```markdown
## Decision: [Title]
**Date**: YYYY-MM-DD
**Status**: Accepted | Deprecated | Superseded

### Context
What situation led to this decision?

### Decision
What did we decide to do?

### Alternatives Considered
- Option A: [why not chosen]
- Option B: [why not chosen]

### Consequences
**Positive**:
- Benefit 1
- Benefit 2

**Negative**:
- Trade-off 1
- Trade-off 2
```

**When to create ADR**:
- Major architecture changes
- Technology selection
- Significant pattern changes
- Security decisions
- Performance trade-offs

**Where to store**: `docs/decisions/YYYYMMDD-decision-title.md`

### 4. Inline Comments

**When to use**:
```typescript
// ✅ GOOD: Explaining why
// Using setTimeout because the DOM needs to render first
setTimeout(() => focus(), 0)

// ✅ GOOD: Warning about gotchas
// Note: This must run before Prisma client initialization
const DATABASE_URL = process.env.DATABASE_URL

// ✅ GOOD: Documenting workaround
// Workaround for Next.js 14 hydration issue: github.com/vercel/next.js/issues/12345
'use client'

// ❌ BAD: Explaining what (code is obvious)
// Set count to 0
const count = 0
```

**Format guidelines**:
- Start with capital letter
- Use complete sentences for complex explanations
- Keep under 80 characters when possible
- Use TODO, FIXME, NOTE, HACK, OPTIMIZE prefixes when appropriate

```typescript
// TODO: Refactor to use new API endpoint
// FIXME: Race condition when user clicks rapidly
// NOTE: This value must match database constraint
// HACK: Temporary workaround until library fixes bug
// OPTIMIZE: Consider memoizing this expensive calculation
```

### 5. API Route Documentation

**Template**:
```typescript
/**
 * POST /api/orders
 * 
 * Creates a new production order
 * 
 * @body {CreateOrderData} - Order data
 * @returns {Order} Created order with ID
 * @throws {400} Validation error
 * @throws {500} Database error
 */
export async function POST(request: NextRequest) {
  // implementation
}
```

### 6. Database Schema Comments

Use Prisma schema comments:
```prisma
model ProductionOrder {
  id String @id @default(cuid())
  
  /// Customer or company name
  customerName String
  
  /// Internal production status tracking
  productionStatus ProductionStatus @default(PENDING)
  
  /// Locked for editing (requires password to unlock)
  isLocked Boolean @default(false)
}
```

## Documentation Maintenance

### Review Cycle
- **Monthly**: Check if examples still work
- **Quarterly**: Update with new patterns
- **On breaking changes**: Update immediately

### Deprecation
When deprecating:
```typescript
/**
 * @deprecated Use newFunction instead
 * @see {@link newFunction}
 */
export function oldFunction()
```

## Examples from This Project

### Component: IconContainer
```typescript
/**
 * Unified icon container with semantic variants
 * 
 * Replaces all hardcoded icon-container-* classes
 * 
 * @component
 * @example
 * ```tsx
 * <IconContainer icon={Plus} variant="success" size="md" />
 * <IconContainer icon={Brain} variant="info" size="lg" />
 * ```
 */
interface IconContainerProps {
  /** Icon component from lucide-react */
  icon: LucideIcon
  /** Semantic color variant */
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  /** Size of the container */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}
```

### API: /api/orders
```typescript
/**
 * POST /api/orders
 * 
 * Creates a new production order with ingredients
 * 
 * @body {CreateOrderData} - Order data including customer, product, and ingredients
 * @returns {ProductionOrder} Created order with generated ID
 * @throws {400} Validation error - invalid data format
 * @throws {500} Database error - connection or constraint issues
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/orders', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     customerName: 'ABC Company',
 *     productName: 'Vitamin C Capsules',
 *     ingredients: [...]
 *   })
 * })
 * ```
 */
export async function POST(request: NextRequest) {
  // implementation
}
```

### Utility: AI Parameter Optimizer
```typescript
/**
 * Optimizes AI model parameters based on task type
 * 
 * @param taskType - Type of AI task (creative, analytical, consensus, interactive)
 * @returns Optimized parameters for the task
 * 
 * @example
 * ```typescript
 * const params = getOptimizedParams('creative')
 * // Returns: { temperature: 0.7, max_tokens: 6000, ... }
 * ```
 */
export function getOptimizedParams(taskType: TaskType): AIParameters {
  // implementation
}
```

### ADR: Design System Architecture
```markdown
## Decision: Unified Design System
**Date**: 2025-01-17
**Status**: Accepted

### Context
Project had 528+ hardcoded colors and inconsistent styling patterns. Maintenance was difficult and design changes required updating multiple files.

### Decision
Implement unified design system with semantic tokens and reusable components.

### Alternatives Considered
- Option A: Keep hardcoded colors - rejected due to maintenance burden
- Option B: Use external design system - rejected due to customization needs
- Option C: Build custom system - chosen for full control

### Consequences
**Positive**:
- Single source of truth for design
- Easy to maintain and update
- Consistent user experience
- Better developer experience

**Negative**:
- Initial migration effort
- Learning curve for new patterns
- Temporary complexity during transition
```

## Documentation Checklist

### For New Components
- [ ] JSDoc with description and examples
- [ ] Props interface with descriptions
- [ ] Usage examples in comments
- [ ] Link to design system if applicable

### For New APIs
- [ ] Route description
- [ ] Request/response schemas
- [ ] Error conditions
- [ ] Usage examples
- [ ] Authentication requirements

### For New Utilities
- [ ] Function description
- [ ] Parameter documentation
- [ ] Return value description
- [ ] Usage examples
- [ ] Performance notes if applicable

### For Architectural Changes
- [ ] Create ADR
- [ ] Document context and alternatives
- [ ] Explain consequences
- [ ] Update related documentation
- [ ] Communicate changes

## Quality Standards

### Writing Style
- Use clear, concise language
- Avoid jargon and acronyms
- Use active voice
- Be specific and actionable

### Code Examples
- Use realistic examples
- Show both simple and complex usage
- Include error handling
- Keep examples up-to-date

### Maintenance
- Review documentation quarterly
- Update examples when code changes
- Remove outdated information
- Keep cross-references current

---

**Last Updated**: 2025-01-17
**Next Review**: 2025-04-17

