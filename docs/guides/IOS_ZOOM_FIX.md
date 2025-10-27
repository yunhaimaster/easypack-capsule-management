# iOS Safari Zoom Prevention Fix

## Problem

When users tap on input fields on iPhone, iOS Safari automatically zooms in if the input font-size is smaller than 16px. This zoom persists after login, creating a poor user experience.

## Root Cause

The `Input` component was using Tailwind's `text-sm` class (14px), which triggers iOS Safari's auto-zoom behavior.

## Solution

Applied **responsive font sizing** to input fields:
- Mobile (< 640px): `text-base` (16px) - Prevents zoom
- Desktop (≥ 640px): `text-sm` (14px) - Maintains original design

## Implementation

### Updated Component: `src/components/ui/input.tsx`

```tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // ... other classes ...
          "text-base sm:text-sm", // Mobile 16px, Desktop 14px
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Key Changes

1. **Added `text-base`** - Sets base font-size to 16px (mobile default)
2. **Added `sm:text-sm`** - Sets font-size to 14px on screens ≥ 640px (desktop)
3. **Maintained all other styling** - No visual changes except font size

## Why This Approach?

### ✅ Recommended Solution
- **Accessibility-friendly**: Users can still zoom manually if needed
- **No viewport restrictions**: Doesn't disable pinch-to-zoom
- **Responsive design**: Larger text on mobile, original size on desktop
- **WCAG compliant**: Maintains accessibility standards

### ❌ Alternative (Not Used)
```html
<!-- Don't use this approach - breaks accessibility -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

## Testing

### Test on iPhone
1. Open login page on iPhone (Safari)
2. Tap on phone number input field
3. **Expected**: No zoom occurs
4. Type phone number
5. **Expected**: Screen remains at normal zoom level
6. Complete login
7. **Expected**: No zoom after redirect to dashboard

### Test on Desktop
1. Open login page on desktop
2. Inspect input field
3. **Expected**: Font size is 14px (text-sm)
4. No visual changes from original design

## Technical Details

### Font Size Mapping
- `text-base`: 16px (1rem)
- `text-sm`: 14px (0.875rem)

### Breakpoint
- `sm:` prefix applies at 640px and above (Tailwind default)

### Affected Components
All components using the `Input` component now have iOS zoom prevention:
- Login form (phone number, OTP code, bootstrap code)
- Order forms
- Recipe forms
- Work order forms
- All search inputs
- All text/number/tel/email inputs

## Browser Support

- ✅ iOS Safari (all versions)
- ✅ Chrome Mobile
- ✅ Firefox Mobile
- ✅ Desktop browsers (unchanged behavior)

## References

- [Apple Technical Note: Preventing Zoom on Input Focus](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/AdjustingtheTextSize/AdjustingtheTextSize.html)
- [WCAG 2.1 Success Criterion 1.4.4: Resize text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html)

## Rollback Instructions

If this change causes issues:

```tsx
// Revert to original (before fix)
className={cn(
  "text-sm", // Remove: text-base sm:text-sm
  // ... other classes
)}
```

## Related Issues

- Prevents iOS Safari auto-zoom on input focus
- Maintains zoom level after authentication
- Improves mobile user experience

---

**Last Updated**: 2025-10-26  
**Author**: AI Assistant  
**Status**: ✅ Implemented & Tested

