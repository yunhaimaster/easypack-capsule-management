# Flexibility Guide

## Philosophy

Rules exist to maintain quality and consistency, but real-world development requires flexibility. This guide helps you make informed decisions about when and how to bend the rules while maintaining project integrity.

## When to Bend the Rules

### Simple Tasks (Skip MCP Tools)

✅ **Skip MCP tools for these tasks:**
- Fixing typos in strings or comments
- Adding existing design system classes
- Updating configuration constants
- Standard CRUD operations with established patterns
- Clear bug fixes with obvious, verified solutions
- Simple CSS adjustments using design tokens
- Updating environment variables
- Adding new routes following existing patterns

**Example:**
```typescript
// ❌ Don't use MCP for this
const API_URL = "https://api.example.com" // Fix typo: was "https://api.exmaple.com"

// ✅ This is obvious and doesn't need research
```

### Performance-Critical Operations

✅ **Skip MCP tools for these scenarios:**
- Real-time websocket handlers
- Build scripts and development tools
- Hot path code optimizations
- Critical rendering paths
- Database connection initialization
- Authentication middleware
- Rate limiting implementations
- Caching strategies

**Example:**
```typescript
// ❌ Don't use MCP for this - performance critical
const db = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

// ✅ Direct implementation for speed
```

### Tool Unavailability

⚠️ **When MCP tools are unavailable:**

**MCP timeout (>30s):**
- Proceed without, add comment explaining limitation
- Add comment: `// MCP unavailable, proceeding with existing knowledge`
- Flag for verification when tools return

**Context7 down:**
- Use BrightData as fallback for documentation
- Search for "[library name] documentation" or "[library name] API reference"
- Verify information recency

**All tools unavailable:**
- Continue with existing knowledge base
- Mark responses as potentially outdated
- Add TODO to verify when tools return
- Document in commit if making assumptions

**Example:**
```typescript
// MCP unavailable, proceeding with existing knowledge
// TODO: Verify this implementation when tools return
const result = await someFunction()
```

## Exception Procedures

### Documentation Requirements

**For all exceptions:**
1. Document in commit message
2. Add inline comment explaining deviation
3. No formal approval needed for solo dev
4. Review exceptions quarterly

**Commit message format:**
```bash
# For hotfixes
[HOTFIX] fix: security patch for authentication bypass

# For design system extensions
feat: extend IconContainer with new variant for [use case]

# For AI parameter experiments
experiment: test temperature 0.8 for recipe generation

# For build test skips
[HOTFIX] fix: production error, type check only
```

**Inline comment format:**
```typescript
// Exception: Component exceeds 250 lines but splitting would break form validation flow
// TODO: Refactor when form logic is simplified
export function ComplexOrderForm() {
  // ... 300 lines of interdependent validation logic
}

// Exception: Using hardcoded color for unique brand requirement
// TODO: Add to design system when pattern is confirmed
<div className="bg-[#FF6B35]"> {/* Brand-specific orange */}
```

### Quarterly Review Process

**Review all exceptions:**
```bash
# Find all exception comments
git log --grep="Exception:" --since="3 months ago"

# Find all deviations
git log --grep="Deviation:" --since="3 months ago"

# Find all hotfixes
git log --grep="\[HOTFIX\]" --since="3 months ago"
```

**Questions to ask:**
1. Were exceptions justified?
2. Should any become permanent patterns?
3. Are there recurring exceptions that indicate rule gaps?
4. Should any rules be updated based on learnings?

## Design System Extensions

### When to Extend

✅ **Extend design system when:**
- New UI pattern needed for specific feature
- Current components don't support required functionality
- Unique brand requirements (with approval)
- Accessibility improvements
- Performance optimizations

❌ **Don't extend for:**
- Personal preferences
- "Looks better" without user research
- Temporary solutions
- One-off styling

### Extension Process

**Step 1: Create new variant in component file**
```typescript
// Extension for [specific use case]
// TODO: Consider contributing back to core design system
export function IconContainer({ 
  icon, 
  variant = "primary", 
  size = "md",
  // New props for extension
  glow = false,
  animated = false 
}: IconContainerProps & {
  glow?: boolean
  animated?: boolean
}) {
  // ... existing implementation
  
  // Extension logic
  if (glow) {
    className += " shadow-glow"
  }
  if (animated) {
    className += " animate-pulse"
  }
}
```

**Step 2: Add comment explaining extension**
```typescript
/**
 * IconContainer with glow effect for AI features
 * 
 * @component
 * @example
 * ```tsx
 * <IconContainer icon={Brain} variant="info" glow />
 * ```
 */
```

**Step 3: Update design system docs**
```markdown
## IconContainer Extensions

### Glow Variant
Used for AI-powered features to indicate intelligence.

```tsx
<IconContainer icon={Brain} variant="info" glow />
```

### Animated Variant
Used for loading states and real-time updates.

```tsx
<IconContainer icon={Loader} variant="neutral" animated />
```
```

**Step 4: Consider contributing back to core**
- If pattern proves useful across features
- Create PR to core design system
- Document in main design system docs
- Remove extension comments once merged

## AI Parameter Experimentation

### When to Experiment

✅ **Experiment when:**
- Response quality is inconsistent
- Costs are higher than expected
- New model versions released
- User feedback suggests improvements
- Performance is slower than expected

❌ **Don't experiment for:**
- One-off requests
- Critical production features
- Security-related AI tasks
- User-facing features without testing

### A/B Testing Framework

**Step 1: Choose non-critical feature**
```typescript
// Good candidates:
// - Internal admin tools
// - Development helpers
// - Non-user-facing analysis
// - Marketing content generation

// Avoid:
// - User authentication
// - Payment processing
// - Critical business logic
```

**Step 2: Document experiment**
```typescript
// Experiment: Recipe generation temperature
// A: temp 0.7 (current) vs B: temp 0.8 (test)
// Metrics: creativity score, user rating, generation time
// Duration: 1 week
// Feature: AI Recipe Generator (non-critical)
```

**Step 3: Track metrics**
```typescript
// Track these metrics:
// - Response time
// - Token usage
// - User satisfaction (if applicable)
// - Error rate
// - Cost per request
```

**Step 4: Document results**
```bash
# Commit message format:
experiment: test temperature 0.8 for recipe generation
Result: 15% faster, 8% more creative, same cost
Decision: Keep A (temp 0.7) - creativity vs speed trade-off
```

**Step 5: Update guidelines**
If experiment shows improvement:
1. Update parameter guidelines
2. Document in AI optimization section
3. Share learnings in project docs
4. Consider broader application

### Parameter Experimentation Examples

**Example 1: Recipe Generation**
```typescript
// Current: temp 0.7, tokens 6000
// Test: temp 0.8, tokens 6000
// Result: More creative but 20% slower
// Decision: Keep current for speed
```

**Example 2: Analysis Tasks**
```typescript
// Current: temp 0.3, tokens 4000
// Test: temp 0.4, tokens 4000
// Result: Slightly more nuanced, same speed
// Decision: Adopt new parameters
```

**Example 3: Interactive Chat**
```typescript
// Current: temp 0.5, tokens 2000
// Test: temp 0.6, tokens 2000
// Result: More engaging, 5% more tokens
// Decision: Adopt for non-cost-sensitive features
```

## Performance-Critical Exemptions

### Real-Time Features

**WebSocket handlers:**
```typescript
// Exception: No MCP tools for real-time performance
// Direct implementation for sub-100ms response
export function handleWebSocketMessage(message: string) {
  // Direct processing, no AI analysis
  return processMessage(message)
}
```

**Streaming responses:**
```typescript
// Exception: Performance critical, no MCP tools
// Must maintain stream continuity
export async function* streamAIResponse(prompt: string) {
  // Direct streaming implementation
  for await (const chunk of aiStream(prompt)) {
    yield chunk
  }
}
```

### Build Scripts and Tooling

**Development tools:**
```typescript
// Exception: Build performance critical
// No MCP tools in build pipeline
export function generateIcons() {
  // Direct file system operations
  // No AI analysis needed
}
```

**Database migrations:**
```typescript
// Exception: Data integrity critical
// No AI analysis for schema changes
export async function migrateDatabase() {
  // Direct Prisma operations
  // No MCP tools for safety
}
```

## Real Examples from This Project

### Example 1: Design System Extension

**Scenario:** Need glow effect for AI features
**Decision:** Extend IconContainer with glow prop
**Implementation:**
```typescript
// Extension for AI features glow effect
<IconContainer icon={Brain} variant="info" glow />
```

**Result:** Used across 3 AI features, considering core contribution

### Example 2: Build Test Exception

**Scenario:** Production authentication bug
**Decision:** Skip full build, type check only
**Implementation:**
```bash
npx tsc --noEmit
git commit -m "[HOTFIX] fix: authentication bypass vulnerability"
```

**Result:** Fixed in 2 minutes, full build in next commit

### Example 3: AI Parameter Experiment

**Scenario:** Recipe generation too slow
**Decision:** Test faster model with lower temperature
**Implementation:**
```typescript
// Experiment: GPT-5 Mini vs GPT-5 for recipes
// Result: 60% faster, 15% less creative
// Decision: Use GPT-5 Mini for simple recipes
```

**Result:** 40% cost reduction, acceptable quality for simple recipes

### Example 4: MCP Tool Timeout

**Scenario:** Sequential Thinking taking 45s for simple question
**Decision:** Proceed with direct analysis
**Implementation:**
```typescript
// MCP unavailable, proceeding with existing knowledge
// TODO: Verify this approach when tools return
const solution = analyzeDirectly(problem)
```

**Result:** Solved in 30s, verified later when tools returned

## Best Practices

### Document Everything
- Always explain why you're bending a rule
- Use consistent comment formats
- Update quarterly reviews

### Test Extensions
- A/B test design system extensions
- Monitor performance impact
- Gather user feedback

### Learn from Exceptions
- Track patterns in exceptions
- Update rules based on learnings
- Share insights with team

### Maintain Quality
- Don't use exceptions as shortcuts
- Maintain code quality standards
- Keep security and performance priorities

## Red Flags

❌ **Stop and reconsider if:**
- You're making exceptions for every task
- Exceptions are becoming the norm
- Quality is degrading
- Rules are being ignored entirely

✅ **Good signs:**
- Exceptions are rare and justified
- Quality remains high
- Rules are generally followed
- Exceptions lead to rule improvements

## Quarterly Review Checklist

- [ ] Review all exceptions from past quarter
- [ ] Identify patterns in deviations
- [ ] Update rules based on learnings
- [ ] Document successful extensions
- [ ] Plan experiments for next quarter
- [ ] Share insights with team
- [ ] Update this guide with new examples

---

**Last Updated**: 2025-01-17
**Next Review**: 2025-04-17

