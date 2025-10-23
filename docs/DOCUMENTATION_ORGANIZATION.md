# Documentation Organization System

## 📁 **Directory Structure**

```
project-root/
├── README.md                    # Main project overview
├── CHANGELOG.md                 # Version history
├── PROJECT_RULES_REVIEW.md     # Rule compliance audit
│
├── docs/
│   ├── README.md               # Documentation index
│   │
│   ├── guides/                 # How-to guides and setup instructions
│   │   ├── DEVELOPMENT_SETUP.md
│   │   ├── LOGIN_GUIDE.md
│   │   ├── PWA_SETUP_GUIDE.md
│   │   ├── MCP_INSTALLATION_GUIDE.md
│   │   └── ...
│   │
│   ├── ai/                     # AI/ML feature documentation
│   │   ├── AI_LABEL_DESIGNER_SUMMARY.md
│   │   ├── DOUBAO_IMAGE_INTEGRATION.md
│   │   ├── CHINESE_MARKET_OPTIMIZATION.md
│   │   └── ...
│   │
│   ├── recipes/                # Recipe library feature docs
│   │   ├── RECIPE_LIBRARY_DEPLOYMENT.md
│   │   ├── RECIPE_OPTIMIZATION_PHASE1_COMPLETE.md
│   │   └── ...
│   │
│   ├── reports/                # Implementation & audit reports
│   │   ├── FULL_APP_AUDIT_REPORT.md
│   │   ├── IMPLEMENTATION_REPORT.md
│   │   ├── DESIGN_SYSTEM_COMPLETION_REPORT.md
│   │   └── ...
│   │
│   ├── migrations/             # Database & deployment migrations
│   │   ├── DEPLOYMENT.md
│   │   ├── MIGRATION_FIX_GUIDE.md
│   │   ├── POSTGRESQL_SETUP.md
│   │   └── ...
│   │
│   ├── archive/                # Outdated/historical documents
│   │   └── ...
│   │
│   ├── ARCHITECTURE.md         # System architecture
│   ├── DESIGN_SYSTEM.md        # Design system guidelines
│   ├── CONFLICT_RESOLUTION.md  # Rule conflict handling
│   ├── FLEXIBILITY_GUIDE.md    # When to bend rules
│   └── MONITORING_GUIDE.md     # Monitoring & metrics
│
└── logs/                       # Build & error logs
    ├── build.log
    ├── build-test.log
    └── ...
```

---

## 🎯 **File Naming Conventions**

### **Root Directory (Only 3 Files Allowed)**
- `README.md` - Project overview and quick start
- `CHANGELOG.md` - Version history and release notes
- `PROJECT_RULES_REVIEW.md` - Rule compliance audit (if needed)

### **docs/guides/** - How-To Guides
Format: `{FEATURE}_GUIDE.md` or `{FEATURE}_SETUP.md`
- Examples: `LOGIN_GUIDE.md`, `PWA_SETUP_GUIDE.md`, `MCP_INSTALLATION_GUIDE.md`

### **docs/ai/** - AI Feature Documentation
Format: `{AI_FEATURE}_{TYPE}.md`
- Examples: `DOUBAO_IMAGE_INTEGRATION.md`, `AI_OPTIMIZATION_SUMMARY.md`

### **docs/recipes/** - Recipe Feature Documentation
Format: `RECIPE_{FEATURE}_{TYPE}.md`
- Examples: `RECIPE_LIBRARY_DEPLOYMENT.md`, `RECIPE_OPTIMIZATION_PHASE1_COMPLETE.md`

### **docs/reports/** - Implementation Reports
Format: `{FEATURE}_{REPORT_TYPE}.md`
- Types: `REPORT`, `SUMMARY`, `ANALYSIS`, `COMPLETE`, `PROGRESS`
- Examples: `FULL_APP_AUDIT_REPORT.md`, `SECURITY_AUDIT_PROGRESS.md`

### **docs/migrations/** - Database & Deployment
Format: `{SYSTEM}_SETUP.md` or `MIGRATION_{FEATURE}.md`
- Examples: `POSTGRESQL_SETUP.md`, `MIGRATION_FIX_GUIDE.md`

---

## 📝 **Rules for Creating New Documentation**

### **1. Never Create Docs in Project Root**
❌ **WRONG:**
```bash
touch NEW_FEATURE_GUIDE.md  # In project root
```

✅ **CORRECT:**
```bash
touch docs/guides/NEW_FEATURE_GUIDE.md
```

### **2. Choose the Right Directory**

| Content Type | Directory | Examples |
|--------------|-----------|----------|
| How-to guide | `docs/guides/` | Setup, installation, usage |
| AI feature | `docs/ai/` | AI models, prompts, optimization |
| Recipe feature | `docs/recipes/` | Recipe library, templates |
| Implementation report | `docs/reports/` | Audit, analysis, completion |
| Migration/deployment | `docs/migrations/` | Database, infrastructure |
| Architecture | `docs/` (root) | Core system design |

### **3. Use Descriptive Names**
- ✅ `LOGIN_GUIDE.md` - Clear and specific
- ✅ `AI_LABEL_DESIGNER_SUMMARY.md` - Descriptive
- ❌ `DOC1.md` - Too vague
- ❌ `notes.md` - Not descriptive

### **4. Archive Old Documents**
When a document becomes outdated:
```bash
mv docs/guides/OLD_FEATURE_GUIDE.md docs/archive/
```

---

## 🚫 **What NOT to Create**

### **Temporary/Session Documents**
❌ Never create these in the repository:
- `SESSION_TIMEOUT_IMPLEMENTATION.md` (session-specific)
- `CHECKBOX_VISIBILITY_FIX.md` (one-time fix)
- `BUILD_OUTPUT.md` (temporary)
- `DEBUG_NOTES.md` (personal notes)

**Why?** These are temporary and should be:
- Documented in commit messages
- Tracked in issue/PR descriptions
- Kept in personal notes (not repo)

### **Duplicate Documentation**
❌ Don't duplicate docs:
```
AI_OPTIMIZATION_SUMMARY.md (root)
docs/ai/AI_OPTIMIZATION_SUMMARY.md (docs)
```

**Keep only one** in the appropriate directory.

---

## 🔄 **Maintenance Process**

### **Monthly Cleanup**
Run this check monthly:
```bash
# Check for misplaced docs in root
ls -1 *.md | grep -v "README\|CHANGELOG\|PROJECT_RULES"

# If any files appear, organize them:
./scripts/organize-docs.sh
```

### **Before Each Release**
1. Update `CHANGELOG.md` with version changes
2. Archive outdated feature docs
3. Update `docs/README.md` index
4. Verify no extra `.md` files in root

---

## ✅ **Quick Decision Tree**

```
Creating new .md file?
│
├─ Is it README/CHANGELOG/PROJECT_RULES? 
│  └─ YES → Project root ✅
│
├─ Is it a how-to guide?
│  └─ YES → docs/guides/ ✅
│
├─ Is it about AI features?
│  └─ YES → docs/ai/ ✅
│
├─ Is it about recipe features?
│  └─ YES → docs/recipes/ ✅
│
├─ Is it an implementation report?
│  └─ YES → docs/reports/ ✅
│
├─ Is it about database/deployment?
│  └─ YES → docs/migrations/ ✅
│
├─ Is it core architecture?
│  └─ YES → docs/ (root) ✅
│
└─ Is it temporary/session notes?
   └─ YES → Don't create it! ❌
```

---

## 📚 **Documentation Index**

Update `docs/README.md` when adding new docs:

```markdown
## Quick Links

### Getting Started
- [Development Setup](guides/DEVELOPMENT_SETUP.md)
- [Login Guide](guides/LOGIN_GUIDE.md)

### AI Features
- [Doubao Image Integration](ai/DOUBAO_IMAGE_INTEGRATION.md)
- [AI Optimization](ai/AI_OPTIMIZATION_SUMMARY.md)

### Feature Documentation
- [Recipe Library](recipes/RECIPE_LIBRARY_DEPLOYMENT.md)
- [Design System](DESIGN_SYSTEM.md)

### Implementation Reports
- [Full App Audit](reports/FULL_APP_AUDIT_REPORT.md)
- [Security Audit](reports/SECURITY_AUDIT_PROGRESS.md)
```

---

## 🎯 **Success Criteria**

**Well-Organized Documentation:**
- ✅ Only 3 `.md` files in project root
- ✅ All guides in `docs/guides/`
- ✅ All reports in `docs/reports/`
- ✅ Clear, descriptive filenames
- ✅ No duplicate documents
- ✅ No temporary/session docs
- ✅ Updated index in `docs/README.md`

---

**Last Updated**: 2025-01-23  
**Maintained By**: AI Assistant + Development Team

