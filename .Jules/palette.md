## 2024-06-29 - Missing ARIA Labels on Icon-only Buttons
**Learning:** React elements with visual icons but no textual labels lack context for screen readers. Using attributes like `aria-label` provides an accessible name for screen readers without altering the visual design.
**Action:** Always provide `aria-label`s on icon-only interactive elements like close buttons and functional tools.

## 2024-11-20 - Hover-revealed Elements Keyboard Accessibility
**Learning:** Interactive elements that are hidden by default and revealed on hover (e.g., via `opacity-0 group-hover:opacity-100`) are invisible to keyboard users because they cannot be discovered through tabbing if they stay visually hidden.
**Action:** Always include `focus-visible:opacity-100` alongside hover-reveal utility classes so that keyboard users can see the interactive elements when they tab to them. Ensure `aria-label`s are also present for screen readers.
