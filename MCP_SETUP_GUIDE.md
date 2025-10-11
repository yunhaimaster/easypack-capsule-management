# MCP Servers Setup Guide

This guide will help you set up three essential MCP servers for your capsuleDB project: PostgreSQL, Vercel, and GitHub.

## Prerequisites

- Node.js and npm installed
- Active Vercel account with deployed project
- GitHub account with repository access
- PostgreSQL database running (locally or remote)

---

## Step 1: Get Your Access Tokens

### A. Vercel Access Token

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Name it: `MCP Server Token`
4. Select the scope you need (recommended: **Full Account**)
5. Click **"Create"**
6. **Copy the token immediately** (you won't see it again!)

### B. GitHub Personal Access Token

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Name it: `MCP Server Token`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:org` (Read org and team membership)
   - ✅ `user` (Read user profile data)
   - ✅ `project` (Access projects)
5. Click **"Generate token"**
6. **Copy the token immediately**

### C. PostgreSQL Connection String

You already have this in your project! Use one of:

**Local Development:**
```
postgresql://postgres:postgres@localhost:5432/capsuledb
```

**Production (Vercel Postgres):**
```
Get from: Vercel Dashboard > Your Project > Storage > Postgres > .env.local tab
Look for: POSTGRES_URL or DATABASE_URL
```

---

## Step 2: Configure MCP Servers in Cursor

### Method 1: Via Cursor Settings UI (Recommended)

1. Open **Cursor Settings**:
   - Mac: `Cmd + ,`
   - Windows/Linux: `Ctrl + ,`

2. Search for **"MCP"** or look for **"Model Context Protocol"**

3. Find the **MCP Servers** configuration section

4. Add the following configuration (paste the JSON below):

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres:postgres@localhost:5432/capsuledb"
      }
    },
    "vercel": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-vercel"],
      "env": {
        "VERCEL_ACCESS_TOKEN": "YOUR_VERCEL_TOKEN_HERE"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_TOKEN_HERE"
      }
    }
  }
}
```

5. **Replace the placeholder values:**
   - `YOUR_VERCEL_TOKEN_HERE` → Your Vercel access token
   - `YOUR_GITHUB_TOKEN_HERE` → Your GitHub personal access token
   - Update PostgreSQL connection string if using production database

6. Save the settings

### Method 2: Via Configuration File

1. Locate your Cursor config directory:
   - **Mac**: `~/Library/Application Support/Cursor/User/`
   - **Windows**: `%APPDATA%\Cursor\User\`
   - **Linux**: `~/.config/Cursor/User/`

2. Find or create: `settings.json`

3. Add the MCP configuration to the file

4. Restart Cursor

---

## Step 3: Verify Installation

After configuring, restart Cursor and verify:

1. Open your project in Cursor
2. In the chat, ask: **"check if my mcp servers are active"**
3. You should see all three servers responding:
   - ✅ PostgreSQL MCP Server
   - ✅ Vercel MCP Server  
   - ✅ GitHub MCP Server

---

## What Each Server Enables

### 🗄️ PostgreSQL MCP Server
**Capabilities:**
- Execute SQL queries directly from chat
- View database schema (tables, columns, relationships)
- Insert, update, delete records
- Analyze data and generate reports
- Optimize queries and indexes

**Example Commands:**
- "Show me all tables in the database"
- "Query the last 10 orders from the database"
- "Update the ingredient price for ID 5"
- "Show me the schema for the work_orders table"

---

### 🚀 Vercel MCP Server
**Capabilities:**
- List and manage deployments
- View deployment logs
- Manage environment variables
- Configure domains and DNS
- Handle project settings
- Trigger new deployments

**Example Commands:**
- "List my recent Vercel deployments"
- "Show me the environment variables for this project"
- "What's the status of my latest deployment?"
- "Get the logs for the last failed deployment"

---

### 🐙 GitHub MCP Server
**Capabilities:**
- Create and manage issues
- View and create pull requests
- Access commit history
- Manage branches
- Review code changes
- Update repository settings

**Example Commands:**
- "Create a GitHub issue for bug tracking"
- "Show me recent commits"
- "List all open pull requests"
- "Create a new branch for feature X"

---

## Troubleshooting

### Issue: "No MCP resources found"
**Solution:**
- Verify tokens are correct and not expired
- Check that `npx` is available in your PATH
- Restart Cursor completely
- Check Cursor Developer Console for errors

### Issue: PostgreSQL connection fails
**Solution:**
- Verify PostgreSQL is running: `docker ps` or `pg_isready`
- Test connection string manually
- Check firewall/network settings
- Ensure database exists

### Issue: Vercel/GitHub authentication fails
**Solution:**
- Regenerate access tokens
- Verify token scopes/permissions
- Check token hasn't expired
- Ensure no extra whitespace in token

---

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit tokens to git**
   - Tokens are sensitive credentials
   - Keep them in Cursor settings only
   - Don't add them to project files

2. **Use minimal permissions**
   - Give tokens only necessary scopes
   - Use read-only tokens when possible

3. **Rotate tokens regularly**
   - Update tokens every 60-90 days
   - Revoke unused tokens immediately

4. **Use different tokens for different purposes**
   - Don't reuse tokens across tools
   - Create separate tokens for MCP servers

---

## Next Steps

Once all MCP servers are active, you can:

1. **Database Management**
   - Ask AI to query your database
   - Generate migration scripts
   - Optimize database performance

2. **Deployment Management**
   - Monitor deployments from Cursor
   - Manage environment variables
   - Debug deployment issues

3. **Code Management**
   - Create issues and PRs from chat
   - Review code changes
   - Track project progress

---

## Reference Files

- Configuration template: `mcp-config.json`
- Environment example: `env.example`
- Vercel setup: `VERCEL_POSTGRES_SETUP.md`
- PostgreSQL setup: `POSTGRESQL_SETUP.md`

---

## Support

If you encounter issues:
1. Check Cursor Developer Console (`Help > Toggle Developer Tools`)
2. Verify all prerequisites are met
3. Review error messages carefully
4. Consult official MCP documentation

**Official Resources:**
- [MCP Specification](https://modelcontextprotocol.io)
- [Vercel MCP Server](https://vercel.com/docs/mcp)
- [Cursor Documentation](https://cursor.sh/docs)



