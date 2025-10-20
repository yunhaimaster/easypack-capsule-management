# Monitoring Guide

## Philosophy

Monitor with tools you already have. No new infrastructure needed. Focus on practical metrics that help improve development velocity and code quality.

## Using Existing Tools

### Build Success Rate

**Tool**: Vercel deployment dashboard + git logs
**Metrics**:
- Deployment success rate (target: >95%)
- Build time trends
- Common error patterns

**Monthly Review**:
```bash
# Check recent build failures
git log --grep="fix: build" --since="1 month ago"

# Review Vercel deployment logs
# Dashboard → Deployments → Filter by Failed
```

**Key Metrics**:
- Build failures per week
- Average build time
- Most common failure types
- Hotfix frequency

**Red Flags**:
- Build failures >5% of deploys
- Build time increasing >20% month-over-month
- Same errors recurring
- Hotfixes >10% of commits

### AI Performance

**Tool**: Vercel function logs + OpenRouter dashboard
**Metrics**:
- Token usage per endpoint
- Response times (target: <10s interactive, <30s analysis)
- Error rates (target: <2%)
- Cost per request

**Weekly Check**:
```bash
# Check OpenRouter dashboard
# Monitor token spend by model
# Review slow requests in Vercel logs
```

**Key Metrics**:
- Token usage by model
- Response time distribution
- Error rate by endpoint
- Cost per successful request

**Red Flags**:
- Token costs spiking >50% week-over-week
- Response times >30s for interactive features
- Error rates >5%
- Cost per request >$0.10

### Design System Compliance

**Tool**: grep + periodic audits
**Metrics**:
- Hardcoded color usage (target: 0)
- Design token adoption (target: 100%)
- Component consistency

**Monthly Audit**:
```bash
# Find hardcoded colors
grep -r "text-blue-\|text-gray-\|text-slate-" src/ --include="*.tsx" | grep -v "text-neutral-\|text-primary-"

# Check for inline styles
grep -r "style={{" src/ --include="*.tsx"

# Find non-design-system components
grep -r "className=\".*bg-\[#" src/

# Check for hardcoded spacing
grep -r "p-\[[0-9]" src/ --include="*.tsx"
```

**Key Metrics**:
- Hardcoded colors found
- Design token usage percentage
- Inline styles count
- Component consistency score

**Red Flags**:
- Hardcoded colors appearing
- Design token usage <90%
- Inline styles >10% of components
- Inconsistent component patterns

### Rule Compliance

**Tool**: Git commit analysis
**Metrics**:
- Exception frequency
- [HOTFIX] commits (target: <5% of total)
- Build test skips
- MCP tool usage patterns

**Quarterly Review**:
```bash
# Count hotfix commits
git log --grep="\[HOTFIX\]" --since="3 months ago" --oneline | wc -l

# Review all exceptions
git log --grep="Exception:\|Deviation:" --since="3 months ago"

# Check for rule updates needed
git log --grep="TODO.*rule\|FIXME.*rule" --since="3 months ago"

# Analyze MCP tool usage
git log --grep="MCP\|Sequential Thinking\|Context7\|BrightData" --since="3 months ago"
```

**Key Metrics**:
- Exceptions per month
- Hotfix percentage
- Rule compliance rate
- MCP tool effectiveness

**Red Flags**:
- Exceptions >20% of commits
- Hotfixes >10% of commits
- Rule compliance <80%
- MCP tools not being used effectively

### Code Quality Trends

**Tool**: TypeScript compiler + git stats
**Metrics**:
- TypeScript errors in development
- Component size distribution
- any type usage (target: 0)
- Refactoring frequency

**Commands**:
```bash
# Check for any types
grep -r ": any" src/ --include="*.ts" --include="*.tsx"

# Find large components
find src/components -name "*.tsx" -exec wc -l {} \; | sort -rn | head -20

# Review recent refactors
git log --grep="refactor:" --since="1 month ago" --oneline

# Check for TODO comments
grep -r "TODO\|FIXME\|HACK" src/ --include="*.ts" --include="*.tsx" | wc -l
```

**Key Metrics**:
- TypeScript error count
- Average component size
- any type usage
- Technical debt items

**Red Flags**:
- TypeScript errors >10 per week
- Components >300 lines
- any types appearing
- TODO count growing

### AI Model Performance

**Tool**: OpenRouter dashboard + custom logging
**Metrics**:
- Model usage distribution
- Parameter effectiveness
- Cost per model
- Quality scores

**Weekly Analysis**:
```bash
# Check model usage in OpenRouter dashboard
# Review cost per model
# Analyze response quality
# Track parameter experiments
```

**Key Metrics**:
- Usage by model type
- Cost efficiency
- Response quality scores
- Parameter optimization results

**Red Flags**:
- Single model overuse
- Cost inefficiency
- Quality degradation
- Parameter experiments failing

## Continuous Improvement

### Document Patterns

When you see repeated issues:

1. **Add to relevant guide** (Flexibility, Conflict Resolution)
2. **Update .cursorrules** if fundamental
3. **Share in project docs**
4. **Create automation** if possible

**Example Pattern Documentation**:
```markdown
## Pattern: Build Failures Due to Type Errors

**Frequency**: 3 times this month
**Root Cause**: Missing type definitions
**Solution**: Add pre-commit type check
**Prevention**: Update build process
```

### Update Guidelines

**Quarterly Process**:

1. **Review metrics** from all categories
2. **Identify pain points** or violations
3. **Discuss if rule needs adjustment**
4. **Update docs** with learnings
5. **Communicate changes**

**Example Updates**:
```markdown
## Updated Rule: Build Testing

**Change**: Allow type-check-only for hotfixes
**Reason**: 40% reduction in hotfix time
**Impact**: No increase in build failures
**Effective**: 2025-01-17
```

### Feedback Loop

```
Monitor → Identify Pattern → Document → Update Rules → Monitor
```

**Implementation**:
1. **Monitor** metrics weekly
2. **Identify** patterns monthly
3. **Document** findings quarterly
4. **Update** rules as needed
5. **Measure** improvement

## Red Flags

### Build Issues
- Build failures >5% of deploys → Review build test process
- Build time >5 minutes → Optimize build process
- Same errors recurring → Update error handling
- Hotfixes >10% of commits → Need better testing

### AI Issues
- Token costs spiking >50% → Review AI parameter optimization
- Response times >30s → Check model selection
- Error rates >5% → Review error handling
- Quality degradation → Check parameter tuning

### Design Issues
- Hardcoded colors appearing → Design system gaps
- Inconsistent components → Update design system
- Accessibility violations → Review design guidelines
- Performance issues → Check component optimization

### Code Issues
- Large components growing → Refactor needed
- TypeScript errors increasing → Improve type safety
- Technical debt growing → Schedule refactoring
- any types appearing → Improve type definitions

### Rule Issues
- Exceptions >20% of commits → Rules too rigid
- Conflicts recurring → Update conflict resolution
- MCP tools unused → Improve tool guidance
- Quality degrading → Review rule effectiveness

## Monitoring Dashboard

### Daily Checks
- [ ] Build status (Vercel dashboard)
- [ ] AI performance (OpenRouter dashboard)
- [ ] Error logs (Vercel functions)

### Weekly Reviews
- [ ] Build success rate
- [ ] AI cost and performance
- [ ] Design system compliance
- [ ] Code quality metrics

### Monthly Audits
- [ ] Rule compliance analysis
- [ ] Exception pattern review
- [ ] Performance trend analysis
- [ ] Quality metric review

### Quarterly Updates
- [ ] Rule effectiveness review
- [ ] Process improvement planning
- [ ] Tool optimization
- [ ] Documentation updates

## Automation Opportunities

### Pre-commit Hooks
```bash
# Type check before commit
npx tsc --noEmit

# Design system compliance check
grep -r "text-blue-\|text-gray-" src/ --include="*.tsx" && exit 1

# Component size check
find src/components -name "*.tsx" -exec wc -l {} \; | awk '$1 > 300 {print "Large component: " $2}'
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Check Design System Compliance
  run: |
    if grep -r "text-blue-\|text-gray-" src/ --include="*.tsx"; then
      echo "Hardcoded colors found"
      exit 1
    fi
```

### Monitoring Scripts
```bash
#!/bin/bash
# Weekly monitoring script

echo "=== Build Success Rate ==="
git log --grep="fix: build" --since="1 week ago" --oneline | wc -l

echo "=== Design System Compliance ==="
grep -r "text-blue-\|text-gray-" src/ --include="*.tsx" | wc -l

echo "=== Code Quality ==="
grep -r ": any" src/ --include="*.ts" --include="*.tsx" | wc -l

echo "=== Component Sizes ==="
find src/components -name "*.tsx" -exec wc -l {} \; | sort -rn | head -5
```

## Success Metrics

### Target Metrics
- **Build Success Rate**: >95%
- **AI Response Time**: <10s interactive, <30s analysis
- **Design System Compliance**: >95%
- **Rule Compliance**: >90%
- **Code Quality**: <5 TypeScript errors/week
- **Hotfix Rate**: <5% of commits

### Improvement Indicators
- Decreasing exception frequency
- Improving build success rate
- Better AI cost efficiency
- Higher design system adoption
- Fewer rule conflicts
- Better code quality metrics

### Warning Thresholds
- Build failures >5%
- AI costs >$100/month
- Hardcoded colors >10
- Exceptions >20% of commits
- Components >300 lines
- any types >5

---

**Last Updated**: 2025-01-17
**Next Review**: 2025-04-17

