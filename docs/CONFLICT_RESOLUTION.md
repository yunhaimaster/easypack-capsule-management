# Conflict Resolution Guide

## Priority Hierarchy

When rules conflict, follow this order:

1. **Security** - Vulnerabilities, data protection, authentication issues
2. **Build Stability** - Must deploy successfully, no broken builds
3. **Design Consistency** - User experience and accessibility
4. **AI Optimization** - Performance and cost efficiency
5. **Code Quality** - Maintainability and best practices

**Rationale**: Security protects users, build stability ensures delivery, design consistency ensures usability, AI optimization ensures efficiency, code quality ensures long-term velocity.

## Common Conflicts

### Conflict 1: Security vs Build Testing

**Scenario**: Production security vulnerability needs immediate patch
**Resolution**: Deploy hotfix immediately, run type check only, full build test in follow-up
**Commit format**: `[HOTFIX] fix: security patch for [issue]`
**Example**: Authentication bypass vulnerability

**Implementation**:
```bash
# 1. Run type check only
npx tsc --noEmit

# 2. Fix any type errors
# 3. Commit with hotfix tag
git commit -m "[HOTFIX] fix: authentication bypass vulnerability"

# 4. Deploy immediately
# 5. Run full build in next regular commit
npm run build
```

### Conflict 2: Component Size vs Functionality

**Scenario**: Feature requires 300-line component, splitting breaks cohesion
**Resolution**: Keep together if splitting creates worse UX, add comment explaining
**Comment format**: `// Component exceeds 250 lines but splitting would break [reason]`
**Example**: Complex form with interdependent validation

**Implementation**:
```typescript
// Exception: Component exceeds 250 lines but splitting would break form validation flow
// TODO: Refactor when form logic is simplified
export function ComplexOrderForm() {
  // ... 300 lines of interdependent validation logic
  // Splitting would require prop drilling and break validation state
}
```

### Conflict 3: Design System vs Unique Requirement

**Scenario**: UI pattern not supported by current design system
**Resolution**: Extend design system with new variant, document extension
**Process**: Add variant → Document → Consider PR to core system
**Example**: New badge style for specific feature

**Implementation**:
```typescript
// Extension for AI model badges
// TODO: Consider contributing back to core design system
export function ModelBadge({ model, size = "md" }: ModelBadgeProps) {
  // New variant not in core design system
  const variant = model === "gpt" ? "primary" : "secondary"
  return <Badge variant={variant} size={size}>{model}</Badge>
}
```

### Conflict 4: AI Parameters vs Response Time

**Scenario**: Optimal parameters cause slow response
**Resolution**: Reduce max_tokens or use faster model, document trade-off
**Example**: Recipe generation taking >15s

**Implementation**:
```typescript
// Trade-off: Speed vs Quality
// Using GPT-5 Mini for faster response (60% faster, 15% less creative)
const params = {
  model: "openai/gpt-5-mini", // Faster than GPT-5
  temperature: 0.7,
  max_tokens: 4000, // Reduced from 6000
  // Documented trade-off: Speed over creativity
}
```

### Conflict 5: Code Quality vs Deadline

**Scenario**: Refactoring would delay critical feature
**Resolution**: Ship functional code, create tech debt ticket
**Process**: Add TODO comment → Create issue → Schedule refactor
**Example**: Duplicate logic across components

**Implementation**:
```typescript
// TODO: Refactor duplicate validation logic
// Issue: #123 - Consolidate form validation
// Scheduled: Next sprint
export function OrderForm() {
  // Duplicate validation logic (acceptable for now)
  const validateOrder = (data) => { /* ... */ }
}
```

### Conflict 6: MCP Tool Use vs Performance

**Scenario**: Sequential Thinking adds 30s delay for simple task
**Resolution**: Skip MCP for simple/urgent tasks, document why
**Example**: Fixing obvious typo during live debugging

**Implementation**:
```typescript
// Exception: Skipping MCP for performance (simple typo fix)
// MCP would add 30s delay for obvious correction
const API_URL = "https://api.example.com" // Fixed typo
```

### Conflict 7: Build Test vs Hotfix Speed

**Scenario**: Critical bug in production, full build takes 5 minutes
**Resolution**: Run type check only, tag [HOTFIX], full build after
**Example**: User-facing error in checkout flow

**Implementation**:
```bash
# 1. Type check only
npx tsc --noEmit

# 2. Fix and commit
git commit -m "[HOTFIX] fix: checkout flow error"

# 3. Deploy immediately
# 4. Full build in next commit
npm run build
```

### Conflict 8: Documentation vs Development Speed

**Scenario**: Writing full ADR delays feature by hours
**Resolution**: Add inline comments, defer formal docs to follow-up
**Example**: Quick architecture tweak for performance

**Implementation**:
```typescript
// Architecture change: Moved AI calls to background
// TODO: Document in ADR when feature is stable
// Reason: Performance optimization for real-time updates
export function useAIAssistant() {
  // Background processing implementation
}
```

### Conflict 9: Design System vs Accessibility

**Scenario**: Design system component not accessible, custom needed
**Resolution**: Create accessible variant, document accessibility requirements
**Example**: Form component missing ARIA labels

**Implementation**:
```typescript
// Accessibility extension for form components
// Required: ARIA labels for screen readers
export function AccessibleFormField({ label, ...props }) {
  return (
    <div>
      <label htmlFor={props.id}>{label}</label>
      <input {...props} aria-describedby={`${props.id}-help`} />
      <div id={`${props.id}-help`} className="sr-only">
        {props.helpText}
      </div>
    </div>
  )
}
```

### Conflict 10: AI Cost vs Quality

**Scenario**: Best model too expensive for feature
**Resolution**: Use cheaper model, document quality trade-off
**Example**: Marketing content generation

**Implementation**:
```typescript
// Cost optimization: Using GPT-5 Mini for marketing content
// Trade-off: 40% cost reduction, 20% quality reduction
// Acceptable for non-critical marketing content
const params = {
  model: "openai/gpt-5-mini",
  temperature: 0.8, // Higher for creativity
  max_tokens: 2000
}
```

### Conflict 11: Build Time vs Feature Completeness

**Scenario**: Feature needs complex build setup, delaying deployment
**Resolution**: Deploy core feature, add complexity in follow-up
**Example**: New AI integration requiring build changes

**Implementation**:
```typescript
// Phase 1: Core AI integration (deploy now)
export function BasicAIAssistant() {
  // Basic implementation
}

// Phase 2: Advanced features (next deployment)
// TODO: Add streaming, caching, error recovery
```

### Conflict 12: Database Performance vs Code Quality

**Scenario**: Optimized query requires complex code
**Resolution**: Use optimized query, add extensive comments
**Example**: Complex report generation

**Implementation**:
```typescript
// Performance critical: Complex report query
// Optimized for 10k+ records, requires complex logic
// TODO: Consider breaking into smaller functions when performance allows
export async function generateReport(filters: ReportFilters) {
  // Complex but optimized query
  const result = await prisma.$queryRaw`
    SELECT ... FROM orders o
    JOIN ingredients i ON o.id = i.orderId
    WHERE o.createdAt >= ${filters.startDate}
    AND o.createdAt <= ${filters.endDate}
    -- Complex joins and aggregations for performance
  `
  return result
}
```

### Conflict 13: User Experience vs Technical Debt

**Scenario**: UX improvement requires quick hack
**Resolution**: Implement hack, create tech debt ticket
**Example**: Loading state improvement

**Implementation**:
```typescript
// UX improvement: Better loading state
// TODO: Refactor to proper state management
// Issue: #124 - Implement proper loading states
export function OrderList() {
  const [loading, setLoading] = useState(false)
  
  // Quick hack for better UX
  useEffect(() => {
    setLoading(true)
    // ... load data
    setTimeout(() => setLoading(false), 100) // Minimum loading time
  }, [])
}
```

### Conflict 14: Security vs User Experience

**Scenario**: Security requires additional auth steps
**Resolution**: Implement security, improve UX in follow-up
**Example**: Password requirements

**Implementation**:
```typescript
// Security first: Strong password requirements
// TODO: Add password strength indicator for better UX
export function PasswordInput({ value, onChange }) {
  const isValid = validatePassword(value)
  
  return (
    <input
      type="password"
      value={value}
      onChange={onChange}
      // Security requirement: No UX compromise
      minLength={12}
      pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]"
    />
  )
}
```

### Conflict 15: Performance vs Maintainability

**Scenario**: Performance optimization makes code harder to maintain
**Resolution**: Optimize for performance, add extensive documentation
**Example**: Caching implementation

**Implementation**:
```typescript
// Performance critical: Caching for AI responses
// Complex implementation required for 50% performance improvement
// TODO: Extract to utility when pattern is proven
export function useAICache() {
  // Complex caching logic with TTL, invalidation, etc.
  // Documented extensively due to complexity
  const cache = useMemo(() => {
    // ... complex caching implementation
  }, [])
  
  return cache
}
```

## Decision Framework

### Step 1: Identify Conflicting Rules
- List all rules that apply to the situation
- Identify which ones conflict
- Understand the trade-offs

### Step 2: Check Priority Hierarchy
1. Security > everything else
2. Build Stability > Development Speed
3. Design Consistency > Individual Preferences
4. AI Optimization > Default Parameters
5. Code Quality > Component Size

### Step 3: Find Matching Scenario
- Look for similar conflicts above
- Use the resolution pattern
- Adapt to your specific situation

### Step 4: Apply Resolution
- Implement the chosen approach
- Document the decision
- Plan follow-up actions

### Step 5: Document Decision
**In commit message:**
```bash
# Format: [TYPE] description (conflict: rule1 vs rule2)
feat: add AI model selection (conflict: cost vs quality)
fix: security patch (conflict: security vs build test)
```

**In code comment:**
```typescript
// Conflict: Performance vs Maintainability
// Resolution: Optimize for performance, document extensively
// TODO: Refactor when performance requirements change
```

### Step 6: Plan Follow-up
- Schedule refactoring if needed
- Create issues for improvements
- Set reminders for review

## Emergency Procedures

### Production Down
**Priority**: Security > everything else
**Process**:
1. Fix immediately
2. Type check only
3. Deploy hotfix
4. Full build after
5. Document in post-mortem

### Security Issue
**Priority**: Fix first, document later
**Process**:
1. Identify vulnerability
2. Implement fix immediately
3. Deploy without delay
4. Document after resolution
5. Review security practices

### User-Facing Bug
**Priority**: Build stability > code quality
**Process**:
1. Fix user impact first
2. Deploy quickly
3. Improve code quality later
4. Create tech debt ticket

### Data Loss Risk
**Priority**: Security > all other rules
**Process**:
1. Stop all operations
2. Assess data integrity
3. Implement fix immediately
4. Verify data safety
5. Resume operations

## Resolution Templates

### Quick Fix Template
```bash
# For urgent fixes
[HOTFIX] fix: [description] (conflict: [rule1] vs [rule2])
# Deploy immediately, full build in next commit
```

### Extension Template
```typescript
// Extension for [specific use case]
// TODO: Consider contributing back to core
// Conflict: [rule1] vs [rule2] - [resolution]
```

### Trade-off Template
```typescript
// Trade-off: [benefit] vs [cost]
// Decision: [chosen approach] for [reason]
// TODO: [follow-up action]
```

### Performance Template
```typescript
// Performance critical: [optimization]
// Complex implementation for [benefit]
// TODO: [simplification when possible]
```

## Review Process

### Weekly Review
- Check for new conflicts
- Review resolution effectiveness
- Update patterns based on learnings

### Monthly Review
- Analyze conflict patterns
- Update resolution templates
- Share insights with team

### Quarterly Review
- Major rule updates
- New conflict scenarios
- Process improvements

## Red Flags

❌ **Stop and reconsider if:**
- Conflicts are happening daily
- Same conflicts keep recurring
- Quality is degrading
- Rules are being ignored

✅ **Good signs:**
- Conflicts are rare and justified
- Resolutions are working
- Quality remains high
- Rules are generally followed

## Success Metrics

- **Conflict frequency**: <5% of commits
- **Resolution effectiveness**: >90% successful
- **Quality maintenance**: No degradation
- **Rule compliance**: >95% adherence

---

**Last Updated**: 2025-01-17
**Next Review**: 2025-04-17





