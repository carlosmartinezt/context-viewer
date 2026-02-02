# Auto-Show Single File with Folder Navigation

## Overview

Improve the file browsing experience by automatically displaying a file when it's the only one in a folder, while providing easy access to navigate to sibling folders/files.

## Requirements

1. **Auto-show single file**: If a folder has exactly 1 file (regardless of subfolder count), auto-display that file's content
2. **Folder navigation above content**: When auto-displaying, show subfolders and other files above the file content
3. **Responsive behavior**:
   - Desktop: navigation always visible, compact layout
   - Mobile: navigation collapsed by default with expand button
4. **Hide empty navigation**: If folder has 1 file AND 0 subfolders, don't show navigation (nothing to navigate to)

## Affected Pages

- **HomePage**: Add single-file auto-display logic (currently missing)
- **FolderPage**: Already has single-file detection, needs navigation component added

## UI Design

### Mobile (Collapsed)
- Compact bar showing "📁 X folders, Y files" or folder name
- Chevron indicator for expandability
- Tap to expand/collapse

### Mobile (Expanded)
- Same card-style list as current folder view
- Folders shown first, then files
- Tap bar again to collapse

### Desktop
- Always visible, compact inline section
- Horizontal chips or smaller cards
- Less prominent than main file content

## Implementation Notes

- Reuse existing folder/file list components where possible
- Detection logic: `isSingleFile = files.length === 1`
- Navigation visibility: `showNav = folders.length > 0 || files.length > 1`
