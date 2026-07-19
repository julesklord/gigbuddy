## 2024-11-20 - ARIA Labels for Transport Controls

**Learning:** Found multiple icon-only transport buttons (Play/Pause, Skip Back, Skip Forward) that lacked semantic names, making them inaccessible to screen readers. The Play/Pause button specifically needed dynamic labels depending on the `isPlaying` state.
**Action:** Always verify that every interactive icon-only element has an `aria-label` or `title`, and dynamically update the `aria-label` for toggleable icon buttons like Play/Pause. Use `pnpx prettier` to format after mass edits since `pnpm format` is missing.

## 2024-11-20 - Accessible Navigation Menu Toggle

**Learning:** The mobile navigation menu toggle button was missing `aria-label` and `aria-expanded` attributes, making it difficult for screen reader users to understand its purpose and current state. It also lacked keyboard focus indicators.
**Action:** Always include `aria-label` and dynamic `aria-expanded` attributes on menu toggle buttons, along with visible focus states (`focus-visible:ring-2 focus-visible:outline-none`) to ensure full accessibility.
