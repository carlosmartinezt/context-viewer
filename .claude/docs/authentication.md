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
| `src/pages/SettingsPage.tsx` | Google Picker (needs access token) |
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

### Problem: "Select Root Folder" Does Nothing on Mobile

**Symptom**: User signs in on mobile, goes to Settings, clicks "Select Root Folder" — nothing happens.

**Root Cause**: The silent token refresh failed (see above), so `accessToken` is `null`. The `handleSelectFolder()` function had an early return: `if (!accessToken) return;` — silently doing nothing.

**Fix**: When `accessToken` is null, `handleSelectFolder()` now calls `requestToken('consent')` to trigger a user-facing consent popup. If the user grants access, the picker opens immediately with the new token.

```typescript
const handleSelectFolder = async () => {
  if (!window.google?.picker) return;
  if (accessToken) {
    openPicker(accessToken);
    return;
  }
  // No token — request with consent popup
  const token = await requestToken('consent');
  if (token) openPicker(token);
};
```

### General Mobile Auth Lesson

On mobile browsers, **never assume silent/invisible auth flows will succeed**. Always:
1. Add timeouts for silent operations that depend on popups/iframes
2. Provide fallback paths that trigger explicit user consent
3. Don't silently fail — either show the UI or request consent

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

## Google Picker Integration

The Google Picker (folder selection in Settings) requires:
1. The `apis.google.com/js/api.js` script loaded dynamically
2. `gapi.load('picker', callback)` to initialize
3. A valid access token passed via `.setOAuthToken(token)`

The Picker script is loaded lazily on the Settings page (not in index.html) since it's only needed there.
