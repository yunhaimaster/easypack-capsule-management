# Accessibility & Compliance Audit

Date: 2025-10-05  
Scope: Easy Health Capsule Management (Next.js 14)

## Summary
- **Overall status:** Partially compliant. Core interactions are accessible, but several WCAG 2.1 AA failures remain (keyboard focus visibility, reduced motion alternatives, colour contrast). HTML semantics are mostly solid; SEO meta data requires enhancements.
- **Priority fixes:** Focus states (WCAG 2.1.1), modal focus trapping (2.4.3), icon-only buttons without ARIA labels (1.1.1 / 4.1.2), colour contrast of pastel glass surfaces (1.4.3).

## WCAG 2.1 Compliance Review

| Issue | Guideline | Severity | Impact | Recommendation | Verification |
| --- | --- | --- | --- | --- | --- |
| Navigation focus indicators are low-contrast on glass backgrounds | 2.4.7 Focus Visible (AA) | High | Keyboard users may lose track of focus on nav links in glass cards | Increase focus outline using `outline: 2px solid rgba(79,70,229,0.8); outline-offset: 2px;` and ensure contrast ratio ≥ 3:1 | Keyboard testing + Windows High Contrast mode |
| Icon-only buttons (e.g., delete, export) lack `aria-label` | 1.1.1 Non-text Content & 4.1.2 Name, Role, Value | High | Screen reader users miss button purpose | Add `aria-label="刪除訂單"` or include visually hidden text | NVDA/JAWS pass-through, Accessibility Insights |
| Modal (`LiquidGlassModal`) does not trap focus or return focus on close | 2.4.3 Focus Order, 2.1.2 No Keyboard Trap | High | Keyboard users can tab behind modal | Implement focus trap loop and restore focus to trigger; consider `react-aria` or `focus-trap` | Keyboard tab test + VoiceOver |
| Decorative background images lack `aria-hidden="true"` | 1.1.1 | Medium | Screen reader noise | Mark decorative SVG backgrounds `aria-hidden` or via CSS pseudo elements | AXE, manual screen reader |
| Pastel status chips (blue on white) fall below 3:1 contrast | 1.4.3 Contrast (Minimum) | Medium | Low vision users | Adjust gradient to darker tones (`from-blue-600 to-blue-700`) or add contrasting border | Contrast checker |
| Toast notifications fade quickly with no pause for screen readers | 2.2.1 Timing Adjustable | Medium | AT users may miss status | Extend timeout to ≥ 10s for success, indefinite for error with close button; add `role="status"` | Screen reader review |
| Scroll animations lack reduced-motion alternative | 2.3.3 Animation from Interactions | Low | Users with vestibular issues | Respect `prefers-reduced-motion: reduce` to disable background animations | Browser dev tools |
| Table sort buttons lack `aria-sort` state | 1.3.1 Info and Relationships | Low | Non-visual users cannot discern current sort order | Apply `aria-sort="ascending|descending"` on `<th>` | Screen reader table navigation |
| Form fields missing descriptive helper text for errors | 3.3.1 Error Identification | Low | Users may not know correction | Provide inline `aria-live="assertive"` error message tied via `aria-describedby` | Form testing |
| Link text “查看記錄”等 lacks context when isolated | 2.4.4 Link Purpose | Low | Screen reader context lost | Append visually hidden text: `<span class="sr-only">訂單列表</span>` | Screen reader review |

## HTML & CSS Standards

- **Semantic HTML:** Good use of `<nav>`, `<main>`, `<section>`. Review repeated `<div>` wrappers—consider using `<aside>` for sidebar stats.
- **Validation:** Run `npm run lint` and `next lint` (currently clean). Still recommended: `npm run lint` + `npm run build` + `npx next lint -- --no-cache` + W3C validator export.
- **CSS Practices:** Tailwind is primary; ensure utility classes respect reduced motion (`motion-safe`). Avoid inline `style` for layout (move to class).
- **Responsive design:** Already mobile-first; verify breakpoints maintain focus states.

## SEO Compliance

| Area | Status | Recommendation |
| --- | --- | --- |
| Meta tags | Basic title/description set globally in `layout.tsx`. | Add page-specific `metadata` for key routes; include canonical links per page. |
| Heading hierarchy | Generally sequential, but homepage uses multiple `h3` without `h2`. | Ensure each section starts with descending order (e.g., wrap mini cards in `<section>` with `h2`). |
| Internal linking | Navigation consistent; confirm breadcrumbs. | Add breadcrumb schema or mention in HTML. |
| Schema markup | None detected. | Implement JSON-LD for `Organization` and `BreadcrumbList`. |
| Mobile-first readiness | Layout is responsive; ensure viewport meta is set (Next does). | Run Google Lighthouse Mobile profile regularly. |

## User Experience Observations

- **Navigation clarity:** Liquid-glass cards visually appealing but rely heavily on colour; add icons + text labels (already present). Ensure active state displayed.
- **Content readability:** Some text 11px; borderline for long passages. Increase body text to 14px minimum for readability.
- **Error message clarity:** Toast messages localized but vanish quickly; add inline error summary for forms.
- **Loading states:** Many components show skeletons; ensure `aria-busy="true"` on containers during fetch.

## Remediation Roadmap

1. **Focus & Keyboard Enhancements (High priority, 1 week)**
   - Add ARIA labels, focus outlines, modal trapping.
   - Testing: Keyboard tab order, Screen reader (NVDA, VoiceOver).

2. **Visual Contrast Adjustments (Medium priority)**
   - Update token palette for badges/buttons.
   - Testing: WebAIM contrast checker, manual.

3. **ARIA & Semantic Improvements (Medium)**
   - Sort indicators, link text context, aria-live on toast.

4. **Motion & Animation fallback (Low)**
   - Wrap background animations in `motion-safe` classes; honour `prefers-reduced-motion`.

5. **SEO & Metadata pass (Low)**
   - Page-specific metadata, structured data.

## Testing Checklist

- [ ] Keyboard-only navigation (tab/shift+tab) across all routes
- [ ] Screen reader compatibility (VoiceOver Safari, NVDA Firefox)
- [ ] AXE / Lighthouse accessibility audit
- [ ] Colour contrast (WCAG AA)
- [ ] Reduced motion preference respected
- [ ] Responsive viewport tests (Chrome DevTools, mobile devices)

## References

- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices/)
- [Web Content Accessibility Guidelines Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Schema.org](https://schema.org/)
