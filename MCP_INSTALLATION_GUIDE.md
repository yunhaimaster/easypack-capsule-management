# MCP Server Installation Guide

**Quick start guide for installing recommended MCP servers**

---

## 🎯 Priority Installation Order

### **Tier 1: Install Now (60 min total)**
1. GitHub MCP (30 min) - Automate GitHub workflows
2. Prisma MCP (15 min) - Database management
3. Verification (15 min) - Test all servers

### **Tier 2: Install Later**
4. Playwright MCP - When ready to automate testing
5. Memory MCP - For context persistence

---

## 1️⃣ GitHub MCP Server (30 minutes)

### Benefits
- ✅ Auto-generate PR descriptions
- ✅ Manage issues and labels
- ✅ Analyze repository structure
- ✅ Review commit history
- ✅ Search code across repos

### Installation Steps

#### Step 1: Install Package (2 min)
```bash
npm install -g @github/github-mcp-server
```

#### Step 2: Generate GitHub Token (5 min)
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `admin:org` (if using organization)
4. Click "Generate token"
5. **Copy the token** (you won't see it again!)

#### Step 3: Configure Cursor (3 min)
1. Open Cursor Settings
2. Go to "Extensions" → "Model Context Protocol"
3. Edit MCP configuration file (usually `~/.cursor/mcp.json`)
4. Add this configuration:

```json
{
  "mcpServers": {
    "github": {
      "command": "github-mcp-server",
      "args": ["--token", "YOUR_GITHUB_TOKEN_HERE"]
    }
  }
}
```

**⚠️ Security Note**: Keep your token secure. Add `.cursor/mcp.json` to `.gitignore` if not already.

#### Step 4: Test GitHub MCP (5 min)
Restart Cursor, then ask AI:
```
"List all open issues in this repository"
"Show recent commits in the main branch"
"Analyze the authentication flow changes"
```

If working, you'll see detailed GitHub information!

---

## 2️⃣ Prisma MCP Server (15 minutes)

### Benefits
- ✅ Automated schema migrations
- ✅ Database inspection and optimization
- ✅ SQL query execution
- ✅ Safe database operations

### Installation Steps

#### Step 1: Install Package (2 min)
```bash
npm install -g @prisma/mcp-server
```

#### Step 2: Get Database URL (2 min)
Your database URL is in `.env.local`:
```bash
DATABASE_URL="postgresql://..."
```

**⚠️ Security**: Never commit database URLs. Use environment variables.

#### Step 3: Configure Cursor (3 min)
Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "github-mcp-server",
      "args": ["--token", "YOUR_GITHUB_TOKEN"]
    },
    "prisma": {
      "command": "prisma-mcp-server",
      "env": {
        "DATABASE_URL": "YOUR_DATABASE_URL_HERE"
      }
    }
  }
}
```

#### Step 4: Test Prisma MCP (5 min)
Restart Cursor, then ask AI:
```
"Show me the ProductionOrder table schema"
"List all indexes on the Ingredient table"
"What tables are in the database?"
```

If working, you'll see schema information!

---

## 3️⃣ Playwright MCP (Optional - When Needed)

### Benefits
- ✅ E2E testing automation
- ✅ Visual regression testing
- ✅ Accessibility audits

### Installation Steps

#### Step 1: Install Package (5 min)
```bash
npm install -g playwright-mcp
npx playwright install  # Downloads browsers
```

#### Step 2: Configure Cursor (2 min)
Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "github": { /* ... */ },
    "prisma": { /* ... */ },
    "playwright": {
      "command": "playwright-mcp"
    }
  }
}
```

#### Step 3: Test Playwright MCP (5 min)
Restart Cursor, then ask AI:
```
"Test the login flow at http://localhost:3000"
"Take a screenshot of the homepage"
"Run accessibility audit on orders page"
```

---

## 4️⃣ Memory MCP (Optional - For Context)

### Benefits
- ✅ Persistent context across sessions
- ✅ Remember project decisions
- ✅ Track technical debt

### Installation Steps

#### Step 1: Install Package (2 min)
```bash
npm install -g memory-mcp-server
```

#### Step 2: Configure Cursor (2 min)
Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "github": { /* ... */ },
    "prisma": { /* ... */ },
    "memory": {
      "command": "memory-mcp-server",
      "args": ["--storage-path", "~/.cursor/memory"]
    }
  }
}
```

#### Step 3: Test Memory MCP (3 min)
Restart Cursor, then tell AI:
```
"Remember that we use Prisma with PostgreSQL in production"
"What database system are we using?" (should recall)
```

---

## 🔍 Verification Checklist

After installation, verify everything works:

### GitHub MCP
- [ ] Can list repository issues
- [ ] Can show commit history
- [ ] Can search code
- [ ] Can analyze file changes

### Prisma MCP
- [ ] Can show database schema
- [ ] Can list tables and indexes
- [ ] Can execute queries (read-only recommended for safety)

### Playwright MCP (if installed)
- [ ] Can open browser
- [ ] Can navigate pages
- [ ] Can take screenshots

### Memory MCP (if installed)
- [ ] Can store information
- [ ] Can retrieve stored information
- [ ] Persists across sessions

---

## 🐛 Troubleshooting

### Common Issues

**Issue: "Command not found: github-mcp-server"**
- **Solution**: Reinstall globally: `npm install -g @github/github-mcp-server`
- **Alternative**: Check global npm bin path: `npm bin -g`

**Issue: "GitHub token invalid"**
- **Solution**: Generate new token with correct scopes
- **Verify**: Token has `repo` and `workflow` permissions

**Issue: "Prisma can't connect to database"**
- **Solution**: Verify `DATABASE_URL` is correct
- **Test**: Run `npx prisma studio` to verify connection

**Issue: "MCP server not responding"**
- **Solution**: Restart Cursor completely (not just reload window)
- **Check**: Look at Cursor console for error messages

**Issue: "Playwright browsers not installed"**
- **Solution**: Run `npx playwright install` again
- **Note**: Downloads ~200MB of browser binaries

---

## 📁 Configuration File Reference

**Complete `~/.cursor/mcp.json` example:**

```json
{
  "mcpServers": {
    "github": {
      "command": "github-mcp-server",
      "args": ["--token", "ghp_xxxxxxxxxxxxxxxxxxxxx"]
    },
    "prisma": {
      "command": "prisma-mcp-server",
      "env": {
        "DATABASE_URL": "postgresql://user:password@host:5432/database"
      }
    },
    "playwright": {
      "command": "playwright-mcp"
    },
    "memory": {
      "command": "memory-mcp-server",
      "args": ["--storage-path", "~/.cursor/memory"]
    }
  }
}
```

**Security Best Practices:**
1. Never commit `mcp.json` with tokens
2. Use environment variables for sensitive data
3. Rotate tokens periodically
4. Use read-only database credentials when possible
5. Limit GitHub token scopes to minimum required

---

## 🚀 Usage Examples

### With GitHub MCP
```typescript
// User asks: "Create PR for the design system refactor"

// AI will:
// 1. Analyze changed files
// 2. Generate comprehensive PR description
// 3. Suggest appropriate reviewers
// 4. Create PR with labels
// 5. Link related issues
```

### With Prisma MCP
```typescript
// User asks: "Add createdBy field to ProductionOrder"

// AI will:
// 1. Update schema.prisma
// 2. Generate migration
// 3. Apply migration (with your approval)
// 4. Update TypeScript types
```

### With Playwright MCP
```typescript
// User asks: "Test the authentication flow"

// AI will:
// 1. Open browser to login page
// 2. Enter test credentials
// 3. Verify redirect to dashboard
// 4. Check auth token storage
// 5. Validate protected routes
// 6. Report results
```

### With Memory MCP
```typescript
// In session 1:
// User: "We decided to use liquid glass design"
// AI stores this decision

// In session 2 (days later):
// User: "What design style are we using?"
// AI: "You're using liquid glass design" (recalls from memory)
```

---

## 📊 Performance Impact

**Install Time:**
- GitHub MCP: ~30 minutes (including token setup)
- Prisma MCP: ~15 minutes
- Playwright MCP: ~15 minutes (including browser download)
- Memory MCP: ~5 minutes

**Resource Usage:**
- Minimal CPU impact (<1%)
- Memory: ~50MB per active MCP server
- Storage: ~200MB for Playwright browsers

**Network:**
- GitHub MCP: Makes API calls to GitHub
- Prisma MCP: Connects to your database
- Playwright MCP: Downloads ~200MB initially, then minimal

---

## 🎯 Quick Start Checklist

**For Maximum Productivity Gain:**

1. [ ] Install GitHub MCP (30 min)
   - Generate token
   - Configure Cursor
   - Test with "list issues" command

2. [ ] Install Prisma MCP (15 min)
   - Get database URL
   - Configure Cursor
   - Test with "show schema" command

3. [ ] Update `.gitignore`
   ```
   # Add if not already there
   .cursor/mcp.json
   ```

4. [ ] Test Cross-MCP Workflow
   ```
   "Analyze the database schema and suggest optimizations"
   (Uses both Sequential Thinking + Prisma MCP)
   ```

5. [ ] Read Enhanced Rules
   - Review MCP Server Selection Guide
   - Understand Cross-MCP Workflows
   - Familiarize with new patterns

---

## 💡 Pro Tips

1. **Start with GitHub MCP** - Biggest immediate impact
2. **Test incrementally** - Install one, verify, then next
3. **Use combinations** - Multiple MCP servers together are powerful
4. **Keep tokens secure** - Never commit to git
5. **Update regularly** - `npm update -g @github/github-mcp-server`
6. **Check logs** - Cursor console shows MCP server activity
7. **Be patient** - First use of each server may be slower

---

## 📚 Additional Resources

- **MCP Documentation**: https://modelcontextprotocol.io
- **GitHub MCP Guide**: https://github.blog/ai-and-ml/generative-ai/a-practical-guide-on-how-to-use-the-github-mcp-server/
- **Prisma MCP Announcement**: https://www.prisma.io/blog/announcing-prisma-s-mcp-server
- **Awesome MCP Servers**: https://github.com/punkpeye/awesome-mcp-servers

---

## ✅ Success!

Once installed, you'll have:
- ✅ Automated GitHub operations
- ✅ Database management capabilities
- ✅ Optional testing and memory features
- ✅ Significantly improved productivity

**Next**: Read the enhanced `.cursorrules` file to learn how to use these powerful tools effectively!

**Questions?** Check the Troubleshooting section above or the MCP Integration Guide in `docs/MCP_INTEGRATION_GUIDE.md`.


