## 2024-11-20 - ARIA Labels for Transport Controls

**Learning:** Found multiple icon-only transport buttons (Play/Pause, Skip Back, Skip Forward) that lacked semantic names, making them inaccessible to screen readers. The Play/Pause button specifically needed dynamic labels depending on the `isPlaying` state.
**Action:** Always verify that every interactive icon-only element has an `aria-label` or `title`, and dynamically update the `aria-label` for toggleable icon buttons like Play/Pause. Use `pnpx prettier` to format after mass edits since `pnpm format` is missing.

## 2024-11-20 - Accessible Navigation Menu Toggle

**Learning:** The mobile navigation menu toggle button was missing `aria-label` and `aria-expanded` attributes, making it difficult for screen reader users to understand its purpose and current state. It also lacked keyboard focus indicators.
**Action:** Always include `aria-label` and dynamic `aria-expanded` attributes on menu toggle buttons, along with visible focus states (`focus-visible:ring-2 focus-visible:outline-none`) to ensure full accessibility.

## 2024-11-20 - Missing ARIA Labels on Unlabelled Range and Text Inputs

**Learning:** Range sliders (e.g., speed, BPM, text size) and standalone textareas (e.g., collaborative notes) often rely purely on surrounding text or placeholders for context. Screen readers cannot properly identify the purpose of these inputs without a direct association or explicit semantic labeling, leading to a confusing experience.
**Action:** When a visually associated `<label>` tag is missing or impractical (due to design constraints), explicitly provide an `aria-label` attribute on `<input>` and `<textarea>` elements so screen readers can accurately communicate their purpose.

## 2024-11-20 - Accessible Custom Toggle Switches

**Learning:** Custom UI components built using standard `<button>` elements to look like toggle switches are often missing critical semantic information. Without `role="switch"` and `aria-checked`, screen readers identify them simply as buttons, and without linking surrounding context via `aria-labelledby` and `aria-describedby`, their purpose is unclear.
**Action:** Always add `role="switch"` and dynamically update `aria-checked` on custom toggle switches. Additionally, use `aria-labelledby` and `aria-describedby` to explicitly connect the switch to its visible label and descriptive text, ensuring a fully accessible experience.
