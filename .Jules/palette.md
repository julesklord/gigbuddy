
## 2026-07-03 - [Keyboard Accessibility for Hover-only UI]
**Learning:** This app frequently uses `opacity-0 group-hover:opacity-100` patterns to show actions like "Delete" only on hover, which hides them completely from keyboard-only and screen reader users.
**Action:** When using `group-hover:opacity-100`, always pair it with `focus-visible:opacity-100` so it can be revealed via tabbing. Additionally, ensure icon-only buttons revealed this way include descriptive `aria-label` attributes for screen reader clarity.
