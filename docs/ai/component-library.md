# Component Library

DO NOT create new components for these patterns. Use what exists.

## CSS Utilities (src/index.css)

These are the core styling primitives. Always use these instead of raw Tailwind classes:

```css
.card         /* White box with rounded corners, shadow, border, padding */
.card-hover   /* Add hover effect to cards */
.btn-primary  /* Blue button (submit, confirm) */
.btn-secondary /* Gray button (cancel, secondary action) */
```

### Usage Examples

```tsx
// Card
<div className="card">Content here</div>

// Clickable card
<div className="card card-hover cursor-pointer">Click me</div>

// Card with accent border (lessons, tournaments)
<div className="card border-l-4 border-l-blue-500">Lesson</div>
<div className="card border-l-4 border-l-amber-500">Tournament</div>

// Buttons
<button className="btn-primary">Save</button>
<button className="btn-secondary">Cancel</button>
```

## Layout Components

### Layout (src/components/layout/Layout.tsx)
Wraps all protected pages with Header and BottomNav.
```tsx
<Layout>
  <Outlet /> {/* Page content renders here */}
</Layout>
```

### Header (src/components/layout/Header.tsx)
Shows app title, user avatar, sign-out button.

### BottomNav (src/components/layout/BottomNav.tsx)
Mobile navigation bar. Icons: 🏠 📚 🏆 📖 ⚙️

## UI Components

### VoiceInput (src/components/ui/VoiceInput.tsx)
Voice/text input for capturing requests to Claude.

```tsx
<VoiceInput
  placeholder="What's happening with chess?"
  onSubmit={(text) => console.log('Request:', text)}
/>
```

Features:
- Speech recognition (Web Speech API)
- Text input fallback
- Saves to localStorage (`chess-tracker-requests`)
- Shows recent requests with pending/completed status

## Page Patterns

### Loading State
```tsx
{isLoading ? (
  <div className="card animate-pulse">
    <div className="h-20 bg-gray-200 rounded"></div>
  </div>
) : (
  /* content */
)}
```

### Error State
```tsx
<div className="card bg-red-50 border border-red-200">
  <h3 className="font-semibold text-red-900 mb-2">Error</h3>
  <p className="text-sm text-red-700">{error.message}</p>
</div>
```

### Empty State
```tsx
<div className="card text-center text-gray-500">
  No items found
</div>
```

### Player Card Pattern (HomePage)
```tsx
<div className="card text-center relative">
  <div className="text-3xl mb-2">{emoji}</div>
  <div className="font-semibold text-gray-900">{name}</div>
  <div className="text-2xl font-bold text-blue-600">{rating}</div>
  <div className="text-xs text-gray-500">Age {age}</div>
  {/* Absolute positioned action button */}
  <button className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100">
    🔄
  </button>
</div>
```

### Event List Pattern
```tsx
<div className="space-y-2">
  {events.map((event) => (
    <div
      key={event.id}
      className={`card card-hover cursor-pointer border-l-4 ${
        event.type === 'tournament' ? 'border-l-amber-500' : 'border-l-blue-500'
      }`}
    >
      {/* content */}
    </div>
  ))}
</div>
```

## Color Conventions

| Purpose | Color | Class |
|---------|-------|-------|
| Primary action | Blue | `text-blue-600`, `bg-blue-600` |
| Tournament accent | Amber | `border-l-amber-500`, `bg-amber-100` |
| Lesson accent | Blue | `border-l-blue-500` |
| Error | Red | `text-red-500`, `bg-red-50` |
| Success | Green | `border-l-green-400` |
| Pending | Amber | `border-l-amber-400` |
| Muted text | Gray | `text-gray-500`, `text-gray-400` |
