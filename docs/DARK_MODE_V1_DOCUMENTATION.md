# Dark Mode V1 Documentation (Current State)

**Date**: 2025-01-24  
**Purpose**: Document current dark mode implementation before V2 redesign  
**Status**: Pre-migration baseline

## Current CSS Variables (V1)

### Liquid Glass System
```css
--liquid-glass-bg: rgba(20, 30, 45, 0.85);      /* Cold blue-tinted */
--liquid-glass-surface: rgba(15, 25, 40, 0.90);  /* Even colder */
--liquid-glass-border: rgba(255, 255, 255, 0.12);
```

### Text Colors
```css
--text-primary: rgba(240, 245, 255, 0.95);       /* Blue-tinted white */
--text-secondary: rgba(220, 230, 245, 0.85);     /* Blue-tinted */
--text-tertiary: rgba(200, 215, 235, 0.70);      /* Blue-tinted */
```

### Shadows
```css
--shadow-sm: 0 8px 32px rgba(0, 0, 0, 0.40);     /* Pure black */
--shadow-md: 0 12px 40px rgba(0, 0, 0, 0.50);    /* Pure black */
```

### Tailwind Semantic Tokens
```css
--background: 215 48% 8%;    /* Blue hue */
--foreground: 215 20% 95%;   /* Blue-tinted */
--card: 215 48% 12%;         /* Blue hue */
--muted: 204 20% 25%;        /* Blue hue */
--border: 204 20% 25%;        /* Blue hue */
--input: 204 20% 25%;        /* Blue hue */
```

## Current Liquid Glass Card (V1)

```css
.dark .liquid-glass-card[data-glass-tone="neutral"],
.dark .liquid-glass-card:not([data-glass-tone]) {
  background: linear-gradient(152deg, rgba(20, 30, 45, 0.92) 0%, rgba(15, 25, 40, 0.88) 100%);
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(240, 245, 255, 0.95);
}
```

## Issues Identified

1. **Cold Blue Tint**: All colors have blue hue (215°, 204°) making it feel sterile
2. **Too Dark Base**: rgba(20, 30, 45) is very dark with cold blue tint
3. **Poor Glass Effect**: 85-90% opacity is too opaque, backdrop-blur wasted
4. **Blue-Tinted Text**: Text colors have blue tint instead of pure white
5. **Invisible Shadows**: Pure black shadows on dark backgrounds are invisible
6. **No Elevation System**: Everything uses same 2-3 colors, no hierarchy

## Rollback Procedure

If V2 causes issues, revert by:

1. **Immediate (env var)**:
   ```bash
   NEXT_PUBLIC_DARK_MODE_V2=false
   vercel --prod
   ```

2. **Code rollback**:
   ```bash
   git revert HEAD~X  # X = number of commits
   git push origin main
   ```

3. **Partial rollback** (keep colors, restore overrides):
   - Keep Phase 1-4 (better colors + elevation)
   - Revert Phase 5 (restore !important overrides)

## Screenshots Needed

Before implementing V2, take screenshots of:
- [ ] Homepage dark mode
- [ ] Orders list dark mode  
- [ ] Order detail page dark mode
- [ ] Recipes page dark mode
- [ ] Work orders page dark mode
- [ ] Navigation dark mode
- [ ] Modal/dialog dark mode

Store in `docs/screenshots/dark-mode-v1/` for comparison.
