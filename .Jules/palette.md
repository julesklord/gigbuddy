## 2024-06-29 - Missing ARIA Labels on Icon-only Buttons
**Learning:** React elements with visual icons but no textual labels lack context for screen readers. Using attributes like `aria-label` provides an accessible name for screen readers without altering the visual design.
**Action:** Always provide `aria-label`s on icon-only interactive elements like close buttons and functional tools.

## 2024-07-25 - Focus-visible for Hover-only Elements
**Learning:** Interactive elements that are hidden by default and only revealed on hover (e.g., using `opacity-0 group-hover:opacity-100`) become inaccessible to keyboard users because they cannot be seen when focused.
**Action:** Always include `focus-visible:opacity-100` alongside hover classes for interactive elements to ensure they become visible when navigating via keyboard. Additionally, providing a clear focus indicator like `focus-visible:ring-2` improves usability.

## 2024-05-19 - Interactive Overlays & Form Associations
**Learning:** Common patterns in React like visual-only hover states over profile pictures (`<div className="group-hover:opacity-100">`) can be made keyboard accessible by replacing the `<div>` with a `<button>` and adding `focus-visible` styles (`focus-visible:opacity-100 focus-visible:ring-2`). Additionally, explicitly linking `<label>` to `<input>` with `htmlFor` and `id` improves accessibility significantly for visually hidden inputs, making it much easier for screen readers to associate the two.
**Action:** When adding or discovering hover-visible elements, check if they describe an action and convert them to interactive elements (`<button>`) with keyboard focus states. Also explicitly link forms with `htmlFor`/`id` combinations.
## 2026-07-08 - Attachment Manager Accessibility Overhaul
**Learning:** Icon-only buttons and unlinked form labels severely impact screen reader usability, especially in dynamically rendered forms like the AttachmentsManager. Adding 'focus-visible' states to hover-only elements makes them discoverable via keyboard navigation.
**Action:** Always link labels to inputs with 'htmlFor' and 'id'. Ensure all icon-only buttons have descriptive 'aria-label's and visible focus states ('focus-visible:ring-2').
## 2026-07-09 - BandConfigView Accessibility Overhaul
**Learning:** Missing explicit linking between labels and inputs, as well as missing focus states and ARIA labels for custom UI elements (like color swatches or custom file inputs), creates significant barriers for screen reader and keyboard users in configuration panels.
**Action:** Always link `<label>`s to `<input>`s with `htmlFor` and `id`. Ensure custom UI controls have clear `aria-label` attributes and visible focus states (`focus-visible:ring-2`) for keyboard navigation.
## 2024-07-26 - Missing Aria Labels and Focus States on Hover-only Elements
**Learning:** Found a pattern where interactive elements that are hidden by default and only revealed on hover (using `opacity-0 group-hover/band:opacity-100`) lack focus states and aria labels, making them completely inaccessible to keyboard and screen reader users.
**Action:** When adding or encountering hover-only interactive elements, ensure they are paired with keyboard focus visibility classes (`focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none`) and descriptive `aria-label`s.
## 2024-07-28 - Missing Form Labels and Aria Attributes in Search Components
**Learning:** Found a pattern where search inputs lack associated labels and submit buttons (icon-only) lack aria labels. This creates significant barriers for screen reader users trying to understand the purpose of form inputs.
**Action:** When adding or encountering search forms, ensure all inputs have associated labels (even if visually hidden with `sr-only`) and all icon-only buttons have descriptive `aria-label`s and visible focus states (`focus-visible:ring-2 focus-visible:outline-none`).

## 2026-07-13 - Explicitly Linking Labels to Inputs in Form Controls
**Learning:** In metadata and form controls, visual proximity of a label to an input does not guarantee accessibility. Screen readers rely on semantic linking (`htmlFor` on `<label>` and `id` on `<input>`) to properly announce the input's purpose to users.
**Action:** Always explicitly link \`<label>\` tags to their corresponding \`<input>\` fields using \`htmlFor\` and \`id\` attributes to ensure robust accessibility.
## 2024-05-19 - Accessible Search Input
**Learning:** Placeholder text is not a reliable replacement for a label for screen reader users. Input fields like the setlist search must have an explicit label or `aria-label`.
**Action:** Always verify that input fields without visible labels have descriptive `aria-label`s for screen reader support.
