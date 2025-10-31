# MCP Server Decision Matrix

Quick reference guide for when to use which MCP server.

## 🎯 Quick Decision Matrix

| **Need to...** | **Use This** | **Why** |
|---------------|--------------|---------|
| Analyze a complex bug | **Sequential Thinking** | Break down systematically |
| Find latest library version | **BrightData** | Real-time web search |
| Get library docs | **Context7** | Official API reference |
| Read multiple files | **Filesystem** | Batch operations |
| Create PR | **GitHub** | Auto PR workflow |
| Database migration | **Prisma MCP** | Schema management |
| Test browser flow | **Playwright** | E2E automation |
| Remember context | **Memory** | Cross-session continuity |

---

## 🧠 Sequential Thinking

**When to use:**
- ✅ Complex debugging with multiple causes
- ✅ Architectural decisions with trade-offs
- ✅ Performance optimization analysis
- ✅ Root cause investigation

**When NOT to use:**
- ❌ Simple, obvious fixes
- ❌ Well-documented patterns
- ❌ Straightforward implementations

**Example:**
```
User: "Why does password prompt appear when editing notes?"
→ Use Sequential Thinking to trace authentication flow
→ Identify logic flaw in field protection
→ Design comprehensive solution
```

---

## 🌐 BrightData

**When to use:**
- ✅ "What's the latest version of X?"
- ✅ Current best practices
- ✅ Package compatibility checks
- ✅ Competition/pricing research

**When NOT to use:**
- ❌ Internal codebase questions
- ❌ When Context7 has docs
- ❌ Information you already know

**Example:**
```
User: "Is Prisma 6 stable for production?"
→ Use BrightData to search recent GitHub issues
→ Check community discussions
→ Provide evidence-based answer
```

---

## 📚 Context7

**When to use:**
- ✅ "How do I use library X?"
- ✅ API reference documentation
- ✅ Migration guides
- ✅ Code examples

**When NOT to use:**
- ❌ General programming concepts
- ❌ Internal/custom libraries
- ❌ Very new libraries (not indexed)

**Example:**
```
User: "Show me React Hook Form with Zod"
→ resolve-library-id("react-hook-form")
→ get-library-docs(id, "zod validation")
→ Provide official patterns
```

---

## 📂 Filesystem

**When to use:**
- ✅ Reading 3+ files simultaneously
- ✅ Pattern-based file search
- ✅ Directory traversal
- ✅ Getting file metadata

**When NOT to use:**
- ❌ Single file reads (use `read_file`)
- ❌ Simple edits (use `search_replace`)
- ❌ Files outside allowed directories

**Example:**
```
User: "Show me all AI-related components"
→ mcp_filesystem_search_files({ pattern: "*ai*.tsx" })
→ mcp_filesystem_read_multiple_files({ paths: [...] })
```

---

## 🐙 GitHub

**When to use:**
- ✅ Creating PRs with descriptions
- ✅ Managing issues and labels
- ✅ Analyzing commit history
- ✅ Code search across repos

**When NOT to use:**
- ❌ Local git operations (use terminal)
- ❌ Simple commits (use git directly)

**Example:**
```
User: "Create PR for design system changes"
→ Analyze changed files
→ Generate PR description
→ Suggest reviewers
→ Create PR with labels
```

---

## 🗃️ Prisma MCP

**When to use:**
- ✅ Running migrations
- ✅ Schema inspection
- ✅ SQL query execution
- ✅ Database optimization

**When NOT to use:**
- ❌ Complex schema design (use CLI)
- ❌ Data seeding (use seed scripts)

**Example:**
```
User: "Add createdBy field to ProductionOrder"
→ Inspect current schema
→ Update schema.prisma
→ Generate migration
→ Apply migration
```

---

## 🎭 Playwright

**When to use:**
- ✅ E2E testing automation
- ✅ Visual regression testing
- ✅ Accessibility audits
- ✅ Screenshot generation

**When NOT to use:**
- ❌ Unit tests (use Jest)
- ❌ API testing (use HTTP clients)

**Example:**
```
User: "Test login flow"
→ Navigate to /login
→ Fill form
→ Verify redirect
→ Check token storage
```

---

## 💭 Memory

**When to use:**
- ✅ Storing project decisions
- ✅ Remembering technical debt
- ✅ Tracking patterns across sessions
- ✅ Learning from past solutions

**When NOT to use:**
- ❌ Sensitive data (use secure storage)
- ❌ Temporary session data
- ❌ Large datasets (use database)

**Example:**
```
User: "What did we decide about authentication?"
→ Retrieve stored context
→ Reference past decisions
→ Apply consistently
```

---

## 🔄 Common Workflows

### Feature Implementation
```
1. Memory MCP → Retrieve context
2. Context7 → Get library docs
3. Sequential Thinking → Plan architecture
4. Filesystem → Read related files
5. [Implement]
6. Prisma MCP → Run migrations
7. Playwright MCP → Test UI
8. GitHub MCP → Create PR
9. Memory MCP → Store decisions
```

### Bug Investigation
```
1. Memory MCP → Check if seen before
2. Sequential Thinking → Analyze symptoms
3. Filesystem → Search related code
4. BrightData → Check known issues
5. [Fix bug]
6. GitHub MCP → Close issues
7. Memory MCP → Store solution
```

### Database Changes
```
1. Sequential Thinking → Plan changes
2. Prisma MCP → Inspect schema
3. [Update schema.prisma]
4. Prisma MCP → Migrate
5. Filesystem → Update types
6. GitHub MCP → Create PR
```

---

## ⚠️ Mandatory Usage Rules

### MUST Use Sequential Thinking When:
- Multiple possible root causes
- Architectural decisions required
- Complex optimization analysis
- User reports unexpected behavior

### MUST Use Context7 When:
- User asks "how to use [library]"
- Implementing features with libraries
- Migration between versions
- Debugging library-specific issues

### MUST Use BrightData When:
- User asks "what's the latest..."
- Need current best practices
- Researching pricing/features
- Checking compatibility

---

## 🚫 Anti-Patterns

### ❌ BAD: Guessing
```
User: "Why does this bug happen?"
AI: "Try removing X" ← NO ANALYSIS
```

### ✅ GOOD: Sequential Thinking
```
AI: [Systematic analysis]
    → Identifies root cause
    → Designs tested solution
```

---

## 📖 Full Documentation

- **Integration Guide**: `docs/MCP_INTEGRATION_GUIDE.md`
- **Installation**: `docs/guides/MCP_INSTALLATION_GUIDE.md`
- **Quick Reference**: `docs/guides/MCP_QUICK_REFERENCE.md`

---

**Last Updated**: 2025-01-31  
**Status**: Active ✅

