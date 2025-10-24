# Scripts Directory

Utility scripts for the Easy Health Capsule Management System.

## Available Scripts

### `setup-local-db.sh`
**Purpose**: Set up local development environment for building without PostgreSQL.

**Usage**:
```bash
./scripts/setup-local-db.sh
```

**What it does**:
1. Creates `.env.local` with mock credentials (if not exists)
2. Generates Prisma Client
3. Prepares environment for `npm run build:local`

**When to use**: First time setting up project locally, or after pulling latest changes that modify Prisma schema.

---

### `migrate-colors.sh`
**Purpose**: Migrate hardcoded Tailwind colors to semantic design tokens.

**Usage**:
```bash
./scripts/migrate-colors.sh
```

**What it does**:
- Converts `text-gray-*` → `text-neutral-*`
- Converts `text-blue-*` → `text-primary-*`
- Converts `text-green/emerald-*` → `text-success-*`
- Converts `text-red-*` → `text-danger-*`
- And more...

**When to use**: After adding new components or when audit shows hardcoded colors.

---

### `postbuild.sh`
**Purpose**: Post-build tasks (runs automatically after `npm run build`).

**Usage**: Automatic (triggered by npm postbuild hook).

**What it does**:
- Cleanup tasks
- Build verification
- Asset optimization (if configured)

---

### `audit-card-consistency.sh`
**Purpose**: Check for Card component consistency issues.

**Usage**:
```bash
./scripts/audit-card-consistency.sh
```

**What it does**:
- Scans for hardcoded card styles
- Verifies design system compliance
- Reports inconsistencies

**When to use**: Before major releases or when refactoring UI components.

---

### `audit-dark-mode.js`
**Purpose**: Audit dark mode implementation across the application.

**Usage**:
```bash
node scripts/audit-dark-mode.js
```

**What it does**:
- Checks dark mode class usage
- Verifies theme consistency
- Reports missing dark mode styles

**When to use**: When implementing or updating dark mode features.

---

## Quick Reference

```bash
# Setup local environment (run once)
./scripts/setup-local-db.sh

# Test build locally
npm run build:local

# Migrate colors to design system
./scripts/migrate-colors.sh

# Audit card consistency
./scripts/audit-card-consistency.sh

# Audit dark mode
node scripts/audit-dark-mode.js
```

---

## Adding New Scripts

When creating new scripts:

1. **Make it executable**:
   ```bash
   chmod +x scripts/your-script.sh
   ```

2. **Add shebang** at the top:
   ```bash
   #!/bin/bash
   ```

3. **Document it** in this README

4. **Add error handling**:
   ```bash
   set -e  # Exit on error
   ```

5. **Test it** before committing

---

## Notes

- All scripts assume they're run from the project root
- Scripts use relative paths for portability
- Check script output for errors before proceeding
- Scripts are designed to be idempotent (safe to run multiple times)

