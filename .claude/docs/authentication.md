# Authentication Architecture

## Overview

The app uses **Google Identity Services (GIS)** for authentication. There are two separate concerns:

1. **Identity** (who the user is) — persisted in localStorage
2. **Access Token** (permission to call Google Drive API) — in-memory only, never persisted

These are decoupled because GIS handles them as separate flows.

## Key Files

| File | Responsibility |
|------|---------------|
| `src/hooks/useAuth.tsx` | AuthProvider context — manages identity, tokens, sign-in/out |
| `src/services/googleAuth.ts` | GIS config, email whitelist, JWT decoding, `waitForGIS()` |
| `src/services/googleDrive.ts` | Drive API calls, token refresher registration |
| `src/pages/LoginPage.tsx` | Google sign-in button rendering |
| `src/pages/SettingsPage.tsx` | Settings, folder picker trigger |
| `src/components/ui/FolderPicker.tsx` | Custom folder browser modal (needs access token) |
| `index.html` | Loads GIS script (`accounts.google.com/gsi/client`) |

## Sign-In Flow

```
User clicks Google button
  → GIS ID flow (google.accounts.id)
  → Returns JWT credential
  → decodeIdToken() extracts email/name/picture
  → isAuthorizedUser() checks against ALLOWED_EMAILS whitelist
  → Identity stored in localStorage ("context-viewer-user")
  → requestAccessToken('consent') triggers GIS OAuth2 token client
  → Access token stored in React state (never localStorage)
  → User redirected to home
```

## Token Architecture

### Identity (Long-lived)
- Stored in `localStorage` as `context-viewer-user`
- Contains: email, name, picture (from Google JWT)
- Survives page refreshes and app restarts
- Cleared only on explicit sign-out

### Access Token (Short-lived, In-Memory)
- Held in React state via `useState` in AuthProvider
- Never written to localStorage or cookies
- Required for all Google Drive API calls and the Google Picker
- Lost on every page refresh — must be re-acquired

### Token Refresh Mechanism
- `driveApiFetch()` in googleDrive.ts detects 401 responses
- Calls registered `tokenRefresher` callback (set by AuthProvider via `setTokenRefresher()`)
- `refreshAccessToken()` in useAuth.tsx handles deduplication via `refreshPromiseRef`
- Silent refresh uses `requestAccessToken({ prompt: '' })` — no user interaction
- If silent refresh fails, functions that need a token can call `requestToken('consent')` to trigger a popup

## Returning User Flow (Page Refresh)

```
Page loads
  → AuthProvider.init() runs
  → Identity restored from localStorage → setUser()
  → loading = true
  → waitForGIS() waits for script
  → google.accounts.id.initialize() with auto_select: true
  → initTokenClient() for Drive scopes
  → Silent token refresh attempted: requestAccessToken('')
  → If succeeds: setAccessToken(), setLoading(false)
  → If fails (timeout after 3s): setLoading(false) anyway
  → User sees the app, may need to re-consent for token on next action
```

## Mobile-Specific Issues & Fixes

### Problem: Silent Token Refresh Blocked on Mobile

**Symptom**: Returning user sees "Signing in..." forever on mobile. Google button never appears.

**Root Cause**: GIS's `requestAccessToken({ prompt: '' })` opens a hidden popup/iframe for silent token refresh. Mobile browsers (especially Safari) block these third-party popups. Neither the success callback nor error_callback fires, so the Promise never resolves.

**Fix**: Added a 3-second timeout in useAuth.tsx. If the silent refresh doesn't complete, `setLoading(false)` fires anyway so the UI becomes interactive.

```typescript
const timeout = setTimeout(() => setLoading(false), 3000);
requestAccessToken('').then((token) => {
  clearTimeout(timeout);
  if (token) setAccessToken(token);
  setLoading(false);
});
```

### Problem: "Select Root Folder" Does Nothing / Triggers Unnecessary Consent

**Symptom**: User signs in on mobile, goes to Settings, clicks "Select Root Folder" — either nothing happens, or it triggers a Google consent popup even though the user is already signed in.

**Root Cause**: The silent token refresh failed (see above), so `accessToken` is `null`. Without a token, the folder picker can't open.

**Fix**: `handleOpenPicker()` in SettingsPage tries a silent refresh first (2-second timeout), then falls back to consent only if silent refresh fails. This avoids unnecessary consent popups on desktop while still working on mobile.

```typescript
const handleOpenPicker = async () => {
  if (!accessToken) {
    const silentToken = await Promise.race([
      requestToken(''),
      new Promise<null>(r => setTimeout(() => r(null), 2000)),
    ]);
    if (!silentToken) {
      const token = await requestToken('consent');
      if (!token) return;
    }
  }
  setPickerOpen(true);
};
```

### Problem: Folders Disappear After Selecting Root Folder

**Symptom**: User selects a root folder, page reloads, all folders gone.

**Root Cause**: Using `window.location.href = '/'` for a hard reload destroys the in-memory access token. The silent token refresh on reload may fail, leaving no token to fetch folders.

**Fix**: Use React Router `navigate('/')` + `queryClient.invalidateQueries()` instead of a hard reload. This refreshes all data and navigates home while keeping the in-memory token alive.

**Key lesson**: Never do `window.location.href` or `window.location.reload()` in this app — it kills the access token. Always use React Router navigation + React Query invalidation.

### General Auth Lessons

1. **Never assume silent auth flows succeed** (especially on mobile). Always add timeouts and fallback to explicit consent.
2. **Never hard-reload the page** (`window.location.href`, `window.location.reload()`). The in-memory access token is lost. Use `navigate()` + `queryClient.invalidateQueries()` instead.
3. **Don't silently fail** — either show the UI or request consent.
4. **Token acquisition pattern**: Try silent first (with timeout), fall back to consent only if needed.

## Auth Context API

The `useAuth()` hook exposes:

| Property | Type | Description |
|----------|------|-------------|
| `user` | `GoogleUser \| null` | Identity (email, name, picture) |
| `accessToken` | `string \| null` | Current Drive API token |
| `loading` | `boolean` | True during initial auth setup |
| `error` | `string \| null` | Auth error message |
| `signIn` | `() => void` | Trigger GIS sign-in prompt |
| `signOut` | `() => void` | Clear identity and token |
| `requestToken` | `(prompt?) => Promise<string \| null>` | Request access token ('consent' for popup, '' for silent) |

## Email Whitelist

Authorized users are hardcoded in `src/services/googleAuth.ts`:

```typescript
const ALLOWED_EMAILS = [
  'carlosmartinezt@gmail.com',
  'lisvette.villar@gmail.com',
  'cjmartinez@meta.com',
];
```

Unauthorized users see an "Unauthorized user" error after sign-in.

## Custom Folder Picker

The Google Picker iframe was replaced with a custom `FolderPicker` component (`src/components/ui/FolderPicker.tsx`).

- Full-screen modal on mobile, centered panel on desktop
- Browsable folder tree starting at "My Drive" (`'root'` as parent ID)
- Breadcrumb navigation for path history
- Uses React Query with `listFolders()` — each folder level cached independently
- Rendered via `createPortal` to avoid z-index issues with header/nav
- Resets to root on every open
- `SettingsPage` handles token acquisition before opening the picker
