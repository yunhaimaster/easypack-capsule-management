# MCP Servers Integration Guide

Complete guide for leveraging Model Context Protocol (MCP) servers in development.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Installed MCP Servers](#installed-mcp-servers)
3. [Sequential Thinking](#1-sequential-thinking)
4. [BrightData Web Scraping](#2-brightdata-web-scraping)
5. [Context7 Documentation](#3-context7-documentation)
6. [Decision Framework](#decision-framework)
7. [Best Practices](#best-practices)
8. [Real-World Examples](#real-world-examples)

---

## Overview

### What are MCP Servers?

MCP (Model Context Protocol) servers extend AI capabilities with specialized tools:
- **Sequential Thinking**: Deep reasoning and problem analysis
- **BrightData**: Real-time web data and search
- **Context7**: Library documentation and API references

### Why Use Them?

| Without MCP | With MCP |
|-------------|----------|
| Guessing based on training data | Analyzing with structured reasoning |
| Using outdated information | Fetching current documentation |
| Limited research capabilities | Access to real-time web data |
| Surface-level solutions | Deep, well-reasoned solutions |

---

## Installed MCP Servers

### Configuration Location
MCP servers are configured in Cursor's settings. Check `~/Library/Application Support/Cursor/mcp.json` (macOS).

### Verification
Run this command to verify MCP servers are accessible:
```bash
# In Cursor, run:
# list_mcp_resources
```

---

## 1. Sequential Thinking

### Core Concept

Break down complex problems into thought steps, allowing for:
- Iterative reasoning
- Hypothesis generation and testing
- Course correction when new info emerges
- Branching to explore alternatives

### Function: `mcp_sequential-thinking_sequentialthinking`

**Parameters:**
- `thought`: Current reasoning step
- `thoughtNumber`: Step number (1, 2, 3...)
- `totalThoughts`: Estimated total steps (can adjust)
- `nextThoughtNeeded`: Boolean for continuation
- `isRevision`: Revising previous thought?
- `revisesThought`: Which thought to revise
- `branchFromThought`: Branching point
- `branchId`: Branch identifier

### When to Use

#### ✅ Perfect For:
1. **Bug Investigation**
   - User reports unexpected behavior
   - Multiple potential causes
   - Need to trace data flow
   
2. **Architectural Decisions**
   - Choosing between approaches
   - Evaluating trade-offs
   - Long-term impact analysis

3. **Performance Optimization**
   - Multiple bottlenecks
   - Complex trade-offs
   - Need systematic analysis

4. **Refactoring**
   - Large-scale code changes
   - Multiple dependencies
   - Need impact analysis

5. **Root Cause Analysis**
   - Intermittent issues
   - Complex interaction bugs
   - System-level problems

#### ❌ Overkill For:
- Simple typo fixes
- Obvious syntax errors
- Well-documented patterns
- Straightforward implementations

### Usage Pattern

```typescript
// Example: Investigating password verification bug

Step 1: Understand the problem
- User reports: "Password prompt when editing notes"
- Data gets lost after password entry
- Expected: No password for non-protected fields

Step 2: Analyze current implementation
- Check authentication flow
- Identify trigger conditions
- Trace data submission

Step 3: Identify root cause
- Password check is too broad
- Checks presence of locked fields, not changes
- No distinction between protected/unprotected fields

Step 4: Design solution
- Add field change detection
- Differentiate protected fields
- Auto-submit after password verification

Step 5: Verify approach
- Frontend: Smart field detection
- Backend: Change comparison
- Both: Security preserved

Step 6-8: Implementation details...
```

### Best Practices

1. **Start with Overview**
   - First thought: Understand the problem
   - Second thought: Analyze current state
   - Then dive deep

2. **Adjust Total Thoughts**
   - Start with estimate (5-10)
   - Increase if needed
   - Decrease if simpler than expected

3. **Use Revisions**
   - When discovering new information
   - When initial assumption was wrong
   - Mark with `isRevision: true`

4. **Branch for Alternatives**
   - Exploring different solutions
   - Comparing approaches
   - Use `branchFromThought` and `branchId`

5. **Conclude with Action**
   - Final thought: Clear solution
   - Actionable steps
   - Implementation plan

---

## 2. BrightData Web Scraping

### Core Concept

Access real-time web data, search engine results, and webpage content without the AI's knowledge cutoff limitations.

### Available Functions

#### `search_engine`
```typescript
{
  query: "string",           // Search query
  engine: "google" | "bing" | "yandex",  // Default: google
  cursor?: "string"          // Pagination cursor
}
```

#### `search_engine_batch`
```typescript
{
  queries: [
    { query: "string", engine: "google" },
    { query: "string", engine: "bing" }
    // Max 10 queries
  ]
}
```

#### `scrape_as_markdown`
```typescript
{
  url: "https://example.com"  // Single URL
}
```

#### `scrape_batch`
```typescript
{
  urls: [
    "https://example1.com",
    "https://example2.com"
    // Max 10 URLs
  ]
}
```

### When to Use

#### ✅ Perfect For:
1. **Library Research**
   - Latest versions
   - Known issues
   - Community discussions
   
2. **Best Practices**
   - Current patterns
   - Industry standards
   - Recent recommendations

3. **Compatibility Checks**
   - Package versions
   - Browser support
   - Platform compatibility

4. **Competitive Analysis**
   - Feature comparison
   - Pricing research
   - Market trends

5. **Documentation**
   - Official docs unavailable in Context7
   - Recent blog posts
   - Tutorial content

#### ❌ Not Needed For:
- Internal codebase info
- Well-known concepts
- When Context7 has docs

### Usage Examples

#### Example 1: Library Version Check
```typescript
// User: "Is Prisma 6 stable for production?"

search_engine({
  query: "Prisma 6 production ready stable issues",
  engine: "google"
})

// Analyze results:
// - Official announcements
// - GitHub issues
// - Community feedback
```

#### Example 2: Best Practices Research
```typescript
// User: "What's the current best practice for Next.js authentication?"

search_engine_batch({
  queries: [
    { query: "Next.js 14 authentication best practices 2024" },
    { query: "NextAuth.js vs Clerk vs Auth0 comparison" },
    { query: "Next.js App Router authentication patterns" }
  ]
})

// Synthesize results into recommendation
```

#### Example 3: Scraping Documentation
```typescript
// User: "Get the latest Vercel deployment docs"

scrape_as_markdown({
  url: "https://vercel.com/docs/deployments/overview"
})

// Extract relevant sections
```

### Best Practices

1. **Specific Queries**
   - ❌ "Next.js"
   - ✅ "Next.js 14 App Router data fetching patterns 2024"

2. **Include Timeframe**
   - Add year or "latest"
   - Filter outdated results
   - Focus on recent content

3. **Batch Similar Searches**
   - More efficient
   - Compare multiple sources
   - Get comprehensive view

4. **Verify Sources**
   - Official documentation first
   - Reputable tech blogs
   - Community consensus

5. **Cross-Reference**
   - Multiple sources
   - Different perspectives
   - Balanced view

---

## 3. Context7 Documentation

### Core Concept

Fetch up-to-date documentation for popular libraries directly from Context7's indexed database.

### Available Functions

#### `resolve-library-id`
```typescript
{
  libraryName: "string"  // e.g., "react-hook-form"
}
```

**Returns**: List of matching libraries with IDs

#### `get-library-docs`
```typescript
{
  context7CompatibleLibraryID: "string",  // e.g., "/org/project"
  topic?: "string",                       // Focus area
  tokens?: number                         // Default: 5000
}
```

**Returns**: Relevant documentation sections

### Workflow

```
1. User asks about library
2. Call resolve-library-id(libraryName)
3. Select best match from results
4. Call get-library-docs(libraryId, topic)
5. Use documentation in solution
```

### When to Use

#### ✅ Perfect For:
1. **API Usage**
   - How to call functions
   - Available methods
   - Parameter types

2. **Integration Patterns**
   - Library setup
   - Configuration
   - Best practices

3. **TypeScript Types**
   - Type definitions
   - Generic usage
   - Type inference

4. **Migration Guides**
   - Version changes
   - Breaking changes
   - Upgrade paths

5. **Examples**
   - Code snippets
   - Real-world usage
   - Common patterns

#### ❌ Not Available For:
- Very new libraries (not indexed yet)
- Internal/custom libraries
- Proprietary code

### Usage Examples

#### Example 1: Basic Usage
```typescript
// User: "How do I use React Hook Form with Zod validation?"

// Step 1: Resolve library
resolve-library-id({ libraryName: "react-hook-form" })
// Returns: [{ id: "/react-hook-form/react-hook-form", ... }]

// Step 2: Get docs
get-library-docs({
  context7CompatibleLibraryID: "/react-hook-form/react-hook-form",
  topic: "zod validation typescript",
  tokens: 7000
})

// Use docs to create example
```

#### Example 2: Specific Version
```typescript
// User: "Show me Next.js 14 server actions"

// Step 1: Resolve with version
resolve-library-id({ libraryName: "next.js 14" })

// Step 2: Get focused docs
get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js/v14",
  topic: "server actions",
  tokens: 10000
})
```

#### Example 3: Multiple Libraries
```typescript
// User: "Set up Prisma with PostgreSQL"

// Parallel resolution
const [prismaId] = await resolve-library-id("prisma")
const [postgresId] = await resolve-library-id("postgresql")

// Get both docs
const prismaDocs = await get-library-docs(prismaId, "postgresql setup")
const postgresDocs = await get-library-docs(postgresId, "connection string")

// Combine into guide
```

### Best Practices

1. **Always Resolve First**
   - Don't guess library IDs
   - Get exact match
   - Check version

2. **Use Focused Topics**
   - Specific feature names
   - Reduces irrelevant docs
   - Better results

3. **Adjust Token Limit**
   - More complex topics = more tokens
   - Start with 5000
   - Increase to 10000+ if needed

4. **Combine with Codebase Search**
   - Context7: Library patterns
   - Codebase search: Project integration
   - Together: Complete solution

---

## Decision Framework

### Quick Decision Tree

```
START: User Request
│
├─ Is it a complex problem?
│  ├─ YES → Use Sequential Thinking
│  └─ NO → Continue
│
├─ Need external information?
│  ├─ Library docs? → Use Context7
│  ├─ Web research? → Use BrightData  
│  └─ No → Use existing knowledge
│
└─ Simple task → Implement directly
```

### Complexity Assessment

| Indicators of Complexity | Action |
|--------------------------|--------|
| Multiple possible causes | Sequential Thinking |
| Affects multiple files | Sequential Thinking |
| Requires trade-off analysis | Sequential Thinking |
| User says "weird bug" | Sequential Thinking |
| Needs architectural decision | Sequential Thinking |

### Information Needs

| Information Type | Tool |
|------------------|------|
| "How to use X library" | Context7 |
| "Latest version of X" | BrightData |
| "Best practice for X" | BrightData |
| "API reference for X" | Context7 |
| "Compatibility of X and Y" | BrightData |
| "Examples of X" | Context7 |

---

## Best Practices

### General Guidelines

1. **Proactive Usage**
   - Don't wait for explicit requests
   - Use when it improves quality
   - Research before guessing

2. **Combine Tools**
   - Sequential Thinking → plan
   - BrightData → research
   - Context7 → implement
   - All together → excellence

3. **Batch Operations**
   - Multiple searches at once
   - Parallel tool usage
   - Efficient workflow

4. **Verify and Validate**
   - Cross-reference sources
   - Test solutions
   - Ensure accuracy

### Anti-Patterns to Avoid

#### ❌ Don't: Guess when uncertain
```typescript
User: "Is this package compatible?"
AI: "Probably, yes" // WRONG - should research
```

#### ✅ Do: Research and verify
```typescript
User: "Is this package compatible?"
AI: [Uses BrightData to search]
    "Based on recent discussions and docs, yes with version X.Y"
```

---

#### ❌ Don't: Use outdated knowledge
```typescript
User: "Show me the latest API"
AI: [Uses training data from 2023] // WRONG
```

#### ✅ Do: Fetch current docs
```typescript
User: "Show me the latest API"
AI: [Uses Context7 to get current docs]
    "Here's the latest API from version X.Y"
```

---

#### ❌ Don't: Surface-level analysis
```typescript
User: "Why does this bug happen?"
AI: "Try this fix" // WRONG - no analysis
```

#### ✅ Do: Deep reasoning
```typescript
User: "Why does this bug happen?"
AI: [Uses Sequential Thinking]
    1. Analyze symptoms
    2. Trace execution flow
    3. Identify root cause
    4. Propose tested solution
```

---

## Real-World Examples

### Example 1: Password Verification Bug Fix

**Scenario**: User reports password prompt appearing when editing notes, and data gets lost.

**Tools Used**: Sequential Thinking

**Process**:
1. **Analysis** (Thoughts 1-3)
   - Understood problem symptoms
   - Reviewed authentication flow
   - Identified verification triggers

2. **Root Cause** (Thoughts 4-6)
   - Password check too broad
   - No field change detection
   - Submission flow interruption

3. **Solution Design** (Thoughts 7-9)
   - Smart field detection
   - Protected vs unprotected fields
   - Auto-submit after verification

4. **Implementation** (Thought 10)
   - Frontend + Backend changes
   - Comprehensive solution

**Result**: Precise fix that distinguished between protected recipe fields and non-protected notes.

---

### Example 2: Library Integration Research

**Scenario**: Need to implement form validation with latest patterns.

**Tools Used**: Context7 + BrightData

**Process**:
1. **Documentation** (Context7)
   ```typescript
   resolve-library-id("react-hook-form")
   get-library-docs(id, "validation patterns")
   ```

2. **Best Practices** (BrightData)
   ```typescript
   search_engine("react-hook-form zod typescript best practices 2024")
   ```

3. **Implementation**
   - Combined official docs with community patterns
   - TypeScript-first approach
   - Production-ready solution

**Result**: Well-researched implementation following current best practices.

---

### Example 3: Complex Refactoring

**Scenario**: Refactor design system with 500+ hardcoded colors.

**Tools Used**: Sequential Thinking + Context7

**Process**:
1. **Planning** (Sequential Thinking)
   - Analyzed scope
   - Identified patterns
   - Planned migration strategy

2. **Research** (Context7)
   ```typescript
   resolve-library-id("tailwindcss")
   get-library-docs(id, "custom colors configuration")
   ```

3. **Execution** (Sequential + Multiple steps)
   - Created design tokens
   - Migrated components systematically
   - Verified consistency

**Result**: Complete design system unification with zero technical debt.

---

## Integration Checklist

Before responding to any request, ask:

- [ ] **Complexity Check**: Would Sequential Thinking improve my analysis?
- [ ] **Currency Check**: Do I need up-to-date information?
- [ ] **Library Check**: Am I working with external libraries?
- [ ] **Research Check**: Would web research strengthen my answer?
- [ ] **Documentation Check**: Should I verify against official docs?

If any answer is **YES**, use the appropriate MCP server.

---

## Performance Tips

1. **Batch Similar Operations**
   - Multiple searches → `search_engine_batch`
   - Multiple scrapes → `scrape_batch`
   - Save time and resources

2. **Cache Results**
   - Reference previous searches in same conversation
   - Don't repeat identical queries
   - Build on previous research

3. **Parallel Execution**
   - Context7 + BrightData simultaneously
   - Independent operations
   - Faster workflow

4. **Focused Queries**
   - Specific = faster results
   - Reduce irrelevant data
   - Better accuracy

---

## Maintenance

### Updating This Guide

When you discover new patterns or best practices:

1. Document the scenario
2. Explain tool usage
3. Share results
4. Update this guide

### Testing MCP Servers

Periodically verify servers are working:

```bash
# In Cursor, try:
# 1. Sequential Thinking
mcp_sequential-thinking_sequentialthinking

# 2. BrightData
search_engine({ query: "test" })

# 3. Context7
resolve-library-id({ libraryName: "react" })
```

---

## Quick Reference Card

### Sequential Thinking
**Use for**: Complex bugs, architecture, refactoring, optimization
**Pattern**: Iterative reasoning with 5-10+ thoughts

### BrightData
**Use for**: Latest info, best practices, compatibility, research
**Tools**: `search_engine`, `search_engine_batch`, `scrape_as_markdown`

### Context7
**Use for**: Library docs, API reference, examples, migration guides
**Workflow**: `resolve-library-id` → `get-library-docs`

---

## Support

### Issues with MCP Servers?

1. Check server configuration
2. Verify network connectivity
3. Review error messages
4. Consult Cursor documentation

### Questions?

- Cursor Forums: https://forum.cursor.sh
- MCP Documentation: https://modelcontextprotocol.io
- Project-specific: Create GitHub issue

---

## Conclusion

MCP servers are powerful multipliers for AI-assisted development:

- **Sequential Thinking**: Transform vague problems into clear solutions
- **BrightData**: Bridge the knowledge gap with real-time data
- **Context7**: Access library wisdom on demand

**Remember**: These tools exist to elevate your work. Use them proactively, not just when asked.

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
**Status**: Active

