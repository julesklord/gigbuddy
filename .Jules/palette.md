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
## 2024-11-20 - Linked Labels for Range Inputs

**Learning:** Range inputs for settings (like scroll speed and text size) had descriptive text that looked like labels but were not programmatically associated using `htmlFor` and `id`, making it difficult for screen readers to properly associate the inputs with their purpose.
**Action:** Always link visible `<label>` elements to their corresponding `<input>` elements using matching `htmlFor` and `id` attributes.

## 2024-11-20 - Missing ARIA Labels on Icon-only Buttons relying on titles

**Learning:** Several icon-only buttons relied solely on the `title` attribute for accessibility. While `title` provides a tooltip on hover for mouse users, it is not consistently announced by all screen readers across different platforms, making it insufficient for full accessibility.
**Action:** A `title` attribute is not a substitute for an `aria-label` on icon-only buttons. Always explicitly include an `aria-label` alongside the `title` (or instead of it) to ensure robust screen reader accessibility.

## 2024-11-20 - Explicit ARIA Labels for Icon-Only Close Buttons

**Learning:** Across the application, numerous icon-only "Close" buttons (using the `<X />` icon) lacked semantic meaning for screen readers, as they had no `aria-label` or `title`. They also lacked visible keyboard focus indicators, impacting keyboard navigation.
**Action:** Always add explicit `aria-label="Close"` (or a context-specific label like "Close menu") and visible focus states (e.g., `focus-visible:ring-2 focus-visible:outline-none`) to icon-only buttons to ensure they are accessible to both screen readers and keyboard users.

## 2024-11-20 - Missing Focus States on Critical Media Controls
**Learning:** The primary media transport controls (Play/Pause, Skip Back, Skip Forward) were styled for mouse interaction with hover scaling and shadows, but completely lacked `focus-visible` indicators. This made it impossible for keyboard-only users to know when they had focused these interactive playback controls.
**Action:** Always include prominent `focus-visible` styles (e.g., `focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none`) on critical interactive media controls to ensure keyboard accessibility matches visual polish.

## 2024-11-20 - ARIA Labels for Transpose Key Buttons

**Learning:** Transpose key adjustment buttons in the live stage view relied solely on `–` and `+` symbols. This visual-only approach is opaque to screen readers, making it difficult for visually impaired musicians to adjust the key. Furthermore, the buttons lacked keyboard focus indicators.
**Action:** Always verify that interactive buttons relying strictly on mathematical symbols or visual cues have descriptive `aria-label` attributes. Add explicit focus indicators like `focus-visible:ring-2` to ensure proper keyboard accessibility.
## 2024-11-06 - Improve screen reader context for icon+text buttons
**Learning:** Buttons with minimal text (like 'Up' or 'Down') alongside an icon may lack context for screen reader users when removed from their surrounding visual layout. Relying on visual context alone creates an accessibility barrier.
**Action:** Always add descriptive `aria-label` attributes to buttons that use abbreviated text or text that relies heavily on visual context, ensuring screen reader users understand the full action (e.g. 'Move song up' instead of just 'Up').

## 2024-05-18 - Visual drag handle noise
**Learning:** Purely visual drag handles intended for pointer devices create unnecessary noise for screen readers, especially when keyboard-accessible alternatives like Up/Down buttons are provided or when the drag handle is just an inline instructional icon.
**Action:** Use `aria-hidden="true"` on the wrapping element of the drag handle (or directly on the icon) to hide it from screen reader users.
## 2024-11-20 - Screen Reader Noise Reduction on Visual Drag Handles

**Learning:** Drag handles intended strictly for pointer/touch interactions create redundant noise for screen reader users when accessible keyboard alternatives (like explicit Up/Down buttons) already exist in the component.
**Action:** Always add `aria-hidden="true"` to purely visual drag handles to streamline the screen reader experience and rely on the explicit semantic buttons for keyboard/assistive navigation.
## 2024-11-20 - Enhanced Empty States and Missing Textarea Labels

**Learning:** Plain text empty states (e.g., "No songs in library") feel unpolished and lack guidance. Additionally, the Advanced Mode JSON textarea lacked an explicitly associated label for screen readers.
**Action:** When displaying empty states for lists or libraries, replace plain text placeholders with visually polished empty states that include relevant icons (e.g., from `lucide-react`) and helpful guidance or call-to-actions. Always link `<label>` tags to their corresponding form elements (like `<textarea>`) using matching `htmlFor` and `id` attributes.
