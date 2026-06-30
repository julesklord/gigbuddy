
## 2024-05-18 - Hover-Only Icon Buttons Accessibility Pattern
**Learning:** Icon-only buttons that are hidden by default and only appear on group hover (e.g., `opacity-0 group-hover:opacity-100`) completely exclude keyboard and screen reader users from accessing those actions (like deleting an item).
**Action:** When creating hover-visible icon buttons, ALWAYS add `focus-visible:opacity-100` alongside `group-hover:opacity-100` so keyboard users can reveal and interact with them. Additionally, include descriptive `aria-label`s since there is no text content.
