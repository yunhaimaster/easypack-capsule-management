# MCP Quick Reference Card

Quick guide for AI assistants on when and how to use MCP servers.

## 🎯 Quick Decision Matrix

| I need to... | Use this MCP |
|--------------|-------------|
| Analyze a complex bug | Sequential Thinking |
| Find latest library version | BrightData |
| Get library documentation | Context7 |
| Plan a refactoring | Sequential Thinking |
| Research best practices | BrightData |
| Learn library API | Context7 |
| Investigate root cause | Sequential Thinking |
| Check compatibility | BrightData |
| See code examples | Context7 |

## 📚 Three Pillars

### 1. Sequential Thinking
**When**: Complex problems, multiple possibilities, need deep analysis
```typescript
// Use for: Debugging, architecture, optimization, refactoring
mcp_sequential-thinking_sequentialthinking({
  thought: "First, let me understand the problem...",
  thoughtNumber: 1,
  totalThoughts: 8,
  nextThoughtNeeded: true
})
```

### 2. BrightData
**When**: Need current information from the web
```typescript
// Use for: Latest versions, trends, compatibility, research
search_engine({ query: "Next.js 15 new features 2024" })
scrape_as_markdown({ url: "https://docs.example.com" })
```

### 3. Context7
**When**: Need library documentation and examples
```typescript
// Use for: API docs, integration patterns, examples
resolve-library-id({ libraryName: "react-hook-form" })
get-library-docs({ 
  context7CompatibleLibraryID: "/org/project",
  topic: "specific feature"
})
```

## ⚡ Quick Rules

### MUST Use When:
- ✅ User reports unexpected behavior → Sequential Thinking
- ✅ Working with external libraries → Context7
- ✅ Need latest information → BrightData
- ✅ Complex architectural decision → Sequential Thinking
- ✅ "What's the latest..." → BrightData
- ✅ "How do I use..." → Context7

### DON'T Use When:
- ❌ Simple, obvious tasks
- ❌ Internal codebase questions (use codebase_search)
- ❌ Well-known concepts (use existing knowledge)

## 🔄 Typical Workflows

### Bug Investigation
```
1. Sequential Thinking → Analyze symptoms
2. Sequential Thinking → Trace flow
3. Sequential Thinking → Identify cause
4. [Optional] Context7 → Check if library issue
5. Sequential Thinking → Design solution
6. Implement fix
```

### Library Integration
```
1. Context7 → Resolve library ID
2. Context7 → Get documentation
3. [Optional] BrightData → Research best practices
4. Implement solution
```

### Research Task
```
1. BrightData → Search for information
2. BrightData → Scrape relevant pages
3. [Optional] Context7 → Get official docs
4. Synthesize and present findings
```

## 💡 Pro Tips

1. **Batch operations**: Use `search_engine_batch` for multiple searches
2. **Be specific**: "Next.js 14 App Router authentication" > "Next.js auth"
3. **Always resolve first**: Call `resolve-library-id` before `get-library-docs`
4. **Think iteratively**: Start with 5-10 thoughts, adjust as needed
5. **Combine tools**: Sequential Thinking + Research + Documentation = Excellence

## 🚫 Anti-Patterns

| ❌ Don't | ✅ Do |
|---------|------|
| Guess when uncertain | Use Sequential Thinking to analyze |
| Use outdated knowledge | Fetch current docs with Context7/BrightData |
| Give surface-level fixes | Deep reasoning with Sequential Thinking |
| Ignore available tools | Proactively use MCP when helpful |

## 📊 Impact Examples

### Without MCP:
```
User: "Password prompt appears when editing notes"
AI: "Try removing the password check"
Result: Incomplete solution, security issues
```

### With MCP (Sequential Thinking):
```
User: "Password prompt appears when editing notes"
AI: [10 reasoning steps analyzing flow]
Result: Precise fix distinguishing protected/unprotected fields
```

## 🎓 Remember

**Your job**: Provide the best possible solution
**Your tools**: Sequential Thinking, BrightData, Context7
**Your approach**: Proactive, research-driven, well-reasoned

**Question to always ask**: "Can an MCP server improve my work?"
- If YES → Use it!
- If NO → Proceed with confidence

---

📖 **Full Guide**: See `docs/MCP_INTEGRATION_GUIDE.md`
⚙️ **Configuration**: See `.cursorrules`

