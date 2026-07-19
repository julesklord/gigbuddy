## 2024-11-20 - ARIA Labels for Transport Controls
**Learning:** Found multiple icon-only transport buttons (Play/Pause, Skip Back, Skip Forward) that lacked semantic names, making them inaccessible to screen readers. The Play/Pause button specifically needed dynamic labels depending on the `isPlaying` state.
**Action:** Always verify that every interactive icon-only element has an `aria-label` or `title`, and dynamically update the `aria-label` for toggleable icon buttons like Play/Pause. Use `pnpx prettier` to format after mass edits since `pnpm format` is missing.
