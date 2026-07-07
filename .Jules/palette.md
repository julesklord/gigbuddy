## 2024-06-29 - Missing ARIA Labels on Icon-only Buttons
**Learning:** React elements with visual icons but no textual labels lack context for screen readers. Using attributes like `aria-label` provides an accessible name for screen readers without altering the visual design.
**Action:** Always provide `aria-label`s on icon-only interactive elements like close buttons and functional tools.

## 2024-07-25 - Focus-visible for Hover-only Elements
**Learning:** Interactive elements that are hidden by default and only revealed on hover (e.g., using `opacity-0 group-hover:opacity-100`) become inaccessible to keyboard users because they cannot be seen when focused.
**Action:** Always include `focus-visible:opacity-100` alongside hover classes for interactive elements to ensure they become visible when navigating via keyboard. Additionally, providing a clear focus indicator like `focus-visible:ring-2` improves usability.

## 2024-05-19 - Interactive Overlays & Form Associations
**Learning:** Common patterns in React like visual-only hover states over profile pictures (`<div className="group-hover:opacity-100">`) can be made keyboard accessible by replacing the `<div>` with a `<button>` and adding `focus-visible` styles (`focus-visible:opacity-100 focus-visible:ring-2`). Additionally, explicitly linking `<label>` to `<input>` with `htmlFor` and `id` improves accessibility significantly for visually hidden inputs, making it much easier for screen readers to associate the two.
**Action:** When adding or discovering hover-visible elements, check if they describe an action and convert them to interactive elements (`<button>`) with keyboard focus states. Also explicitly link forms with `htmlFor`/`id` combinations.
