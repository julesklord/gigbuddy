1. **Add `aria-hidden="true"` to visual drag handles in `DraggableStageBlock.tsx` and `GlobalSettingsView.tsx`**.
   - Draggable objects have a visual `GripVertical` handle icon for dragging.
   - Screen readers don't need this, because they rely on alternative explicit up/down arrows or the drag itself isn't fully accessible via standard screen reader traversal.
   - In `DraggableStageBlock.tsx`, the parent `div` handles the drag. It's purely visual, and keeping it hidden reduces screen reader noise. Add `aria-hidden="true"` to the `div` wrapper for the drag handle, just like it's done in `SetlistReorderItem.tsx`.
   - In `GlobalSettingsView.tsx`, the `GripVertical` icon is used purely as a visual indicator in a helper text (`<GripVertical size={12} className="opacity-50" /> Drag elements to reorder...`). It needs `aria-hidden="true"` to avoid redundant announcements.
2. **Complete pre commit steps**
   - Complete pre commit steps to make sure proper testing, verifications, reviews and reflections are done.
3. **Submit the change**
   - Submit the change with descriptive commit title and description about the UX enhancement.
