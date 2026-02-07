# Auto-Show Single File Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically display a file when it's the only one in a folder, with collapsible folder navigation above on mobile and always-visible navigation on desktop.

**Architecture:** Create a reusable `FolderNav` component that shows folder contents in a collapsible (mobile) or inline (desktop) format. Update HomePage and FolderPage to use single-file detection and render FolderNav above auto-displayed content.

**Tech Stack:** React, TypeScript, TailwindCSS v4, React Router

---

### Task 1: Create FolderNav Component

**Files:**
- Create: `src/components/ui/FolderNav.tsx`

**Step 1: Create the FolderNav component**

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FolderItem {
  id: string;
  name: string;
}

interface FolderNavProps {
  folders: FolderItem[];
  files: FolderItem[];
}

export function FolderNav({ folders, files }: FolderNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Hide if nothing to navigate to (single file, no folders)
  if (folders.length === 0 && files.length <= 1) {
    return null;
  }

  const itemCount = folders.length + files.length;

  return (
    <>
      {/* Mobile: Collapsible */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full card flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center">
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <span className="text-sm text-[var(--color-text-secondary)]">
              {folders.length > 0 && `${folders.length} folder${folders.length !== 1 ? 's' : ''}`}
              {folders.length > 0 && files.length > 0 && ', '}
              {files.length > 0 && `${files.length} file${files.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                to={`/folder/${folder.id}`}
                className="card card-hover flex items-center gap-3 py-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <span className="font-medium text-[var(--color-text)] truncate text-sm">{folder.name}</span>
                <svg className="w-4 h-4 text-[var(--color-text-tertiary)] ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
            {files.map((file) => (
              <Link
                key={file.id}
                to={`/file/${file.id}`}
                className="card card-hover flex items-center gap-3 py-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="font-medium text-[var(--color-text)] truncate text-sm">{file.name.replace('.md', '')}</span>
                <svg className="w-4 h-4 text-[var(--color-text-tertiary)] ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Always visible, compact */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap gap-2">
          {folders.map((folder) => (
            <Link
              key={folder.id}
              to={`/folder/${folder.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-subtle)] hover:bg-[var(--color-border-subtle)] text-sm text-[var(--color-text)] transition-colors"
            >
              <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {folder.name}
            </Link>
          ))}
          {files.map((file) => (
            <Link
              key={file.id}
              to={`/file/${file.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-subtle)] hover:bg-[var(--color-border-subtle)] text-sm text-[var(--color-text)] transition-colors"
            >
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {file.name.replace('.md', '')}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds (component not yet used)

**Step 3: Commit**

```bash
git add src/components/ui/FolderNav.tsx
git commit -m "feat: add FolderNav component for collapsible folder navigation"
```

---

### Task 2: Update HomePage with Single-File Auto-Display

**Files:**
- Modify: `src/pages/HomePage.tsx`

**Step 1: Update HomePage to detect single file and show FolderNav**

Add import at top:
```tsx
import { FolderNav } from '../components/ui/FolderNav';
```

Add single-file detection after `indexFile` query (around line 31):
```tsx
const isSingleFile = contents?.files.length === 1;
const singleFile = isSingleFile ? contents.files[0] : null;
const fileToShow = singleFile || indexFile;

const { data: fileContent } = useQuery({
  queryKey: ['fileContent', fileToShow?.id, user?.accessToken],
  queryFn: () => readFile(user!.accessToken, fileToShow!.id),
  enabled: !!user?.accessToken && !!fileToShow?.id,
});
```

Replace the `indexContent` query and update render logic to show FolderNav + file content when single file detected.

**Step 2: Full updated HomePage render section**

Replace the loading/content section (after the headers) with:
```tsx
{isLoading ? (
  <div className="card animate-pulse space-y-4">
    <div className="h-6 bg-[var(--color-bg-subtle)] rounded w-1/2"></div>
    <div className="h-4 bg-[var(--color-bg-subtle)] rounded w-3/4"></div>
    <div className="h-4 bg-[var(--color-bg-subtle)] rounded w-2/3"></div>
  </div>
) : isSingleFile && fileContent ? (
  <div className="space-y-4">
    <FolderNav folders={contents?.folders || []} files={contents?.files || []} />
    <div className="card">
      <MarkdownViewer content={fileContent} />
    </div>
  </div>
) : (
  <>
    {fileContent && (
      <div className="card">
        <MarkdownViewer content={fileContent} />
      </div>
    )}

    {contents?.folders && contents.folders.length > 0 && (
      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
          Folders
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {contents.folders.map((folder) => (
            <Link
              key={folder.id}
              to={`/folder/${folder.id}`}
              className="card card-hover flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <span className="font-medium text-[var(--color-text)] truncate">{folder.name}</span>
              <svg className="w-4 h-4 text-[var(--color-text-tertiary)] ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    )}

    {otherFiles.length > 0 && (
      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
          Files
        </h3>
        <div className="space-y-2">
          {otherFiles.map((file) => (
            <Link
              key={file.id}
              to={`/file/${file.id}`}
              className="card card-hover flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-subtle)] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[var(--color-text)] truncate">
                {file.name.replace('.md', '')}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)]">{file.name}</div>
            </div>
            <svg className="w-4 h-4 text-[var(--color-text-tertiary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  )}

  {(!contents?.folders?.length && !contents?.files?.length) && (
    <div className="card text-[var(--color-text-secondary)] text-center py-12">
      <p>This folder is empty</p>
    </div>
  )}
</>
)}
```

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Test manually**

Run: `npm run dev`
- Test root folder with single file → should auto-display with FolderNav above
- Test root folder with multiple files → should show normal folder view

**Step 5: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat: auto-display single file in HomePage with FolderNav"
```

---

### Task 3: Update FolderPage with FolderNav

**Files:**
- Modify: `src/pages/FolderPage.tsx`

**Step 1: Add FolderNav import**

```tsx
import { FolderNav } from '../components/ui/FolderNav';
```

**Step 2: Update single-file detection logic**

Change line 24-26 from:
```tsx
const isSingleFileFolder = contents &&
  contents.folders.length === 0 &&
  contents.files.length === 1;
```

To:
```tsx
const isSingleFile = contents?.files.length === 1;
```

**Step 3: Update render to show FolderNav above auto-displayed content**

Replace the single-file render block (around line 67-70):
```tsx
) : isSingleFileFolder && fileContent ? (
  <div className="card">
    <MarkdownViewer content={fileContent} />
  </div>
)
```

With:
```tsx
) : isSingleFile && fileContent ? (
  <div className="space-y-4">
    <FolderNav folders={contents?.folders || []} files={contents?.files || []} />
    <div className="card">
      <MarkdownViewer content={fileContent} />
    </div>
  </div>
)
```

**Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Test manually**

Run: `npm run dev`
- Navigate to folder with single file → should auto-display with FolderNav
- Navigate to folder with single file AND subfolders → should show FolderNav with subfolders above file
- Navigate to folder with single file, no subfolders → FolderNav should be hidden

**Step 6: Commit**

```bash
git add src/pages/FolderPage.tsx
git commit -m "feat: add FolderNav to FolderPage for single-file auto-display"
```

---

### Task 4: Final Verification

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run lint**

Run: `npm run lint`
Expected: No lint errors

**Step 3: Manual testing checklist**

- [ ] HomePage: Root folder with 1 file, 0 folders → auto-display, no nav
- [ ] HomePage: Root folder with 1 file, 2 folders → auto-display with nav (mobile collapsed, desktop chips)
- [ ] HomePage: Root folder with 3 files → normal folder view
- [ ] FolderPage: Subfolder with 1 file, 0 folders → auto-display, no nav
- [ ] FolderPage: Subfolder with 1 file, 1 folder → auto-display with nav
- [ ] FolderPage: Subfolder with 2 files → normal folder view
- [ ] Mobile: FolderNav collapsed by default, expands on tap
- [ ] Desktop: FolderNav always visible as chips

**Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: cleanup and final adjustments"
```
