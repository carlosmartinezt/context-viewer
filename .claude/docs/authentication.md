# Authentication Architecture

## Overview

The app uses **Google Identity Services (GIS) authorization code flow** with Vercel serverless functions for authentication. This replaces the previous implicit token flow which couldn't persist sessions across page reloads on mobile.

There are two separate concerns:

1. **Identity** (who the user is) — persisted in localStorage
2. **Access Token** (permission to call Google Drive API) — in-memory only, refreshed via server-side HTTP-only cookie

## Key Files

| File | Responsibility |
|------|---------------|
| `src/hooks/useAuth.tsx` | AuthProvider context — manages identity, tokens, sign-in/out |
| `src/services/googleAuth.ts` | GIS config, email whitelist, `waitForGIS()` |
| `src/services/googleDrive.ts` | Drive API calls, token refresher registration |
| `src/pages/LoginPage.tsx` | Custom "Sign in with Google" button |
| `src/pages/SettingsPage.tsx` | Settings, folder picker trigger |
| `src/components/layout/Layout.tsx` | Reconnect banner for expired sessions |
| `src/components/ui/FolderPicker.tsx` | Custom folder browser modal (needs access token) |
| `api/auth/_utils.ts` | Shared constants: allowed emails, cookie helpers |
| `api/auth/exchange.ts` | POST — exchanges auth code for tokens, sets refresh cookie |
| `api/auth/refresh.ts` | POST — refreshes access token using HTTP-only cookie |
| `api/auth/revoke.ts` | POST — revokes refresh token, clears cookie |
| `index.html` | Loads GIS script (`accounts.google.com/gsi/client`) |

## Sign-In Flow (Authorization Code Flow)

```
User clicks "Sign in with Google" button
  → signIn() calls codeClientRef.requestCode()
  → GIS popup opens → user consents → returns auth code
  → Frontend POSTs code to /api/auth/exchange
  → Server exchanges code with Google for access_token + refresh_token + id_token
  → Server decodes id_token for user info (email, name, picture)
  → Server validates email against ALLOWED_EMAILS whitelist
  → Server sets refresh_token as HTTP-only cookie (7 days)
  → Server returns { access_token, expires_in, user }
  → Frontend stores user in localStorage, access_token in React state
  → User redirected to home
```

## Token Architecture

### Identity (Long-lived)
- Stored in `localStorage` as `context-viewer-user`
- Contains: email, name, picture (from Google id_token, decoded server-side)
- Survives page refreshes and app restarts
- Cleared only on explicit sign-out

### Access Token (Short-lived, In-Memory)
- Held in React state via `useState` in AuthProvider
- Never written to localStorage or cookies
- Required for all Google Drive API calls and the folder picker
- Lost on every page refresh — re-acquired via server refresh

### Refresh Token (Long-lived, HTTP-only Cookie)
- Set by `/api/auth/exchange` on first sign-in
- Stored as `auth_refresh_token` HTTP-only cookie (7 days, SameSite=Lax)
- Never accessible to frontend JavaScript
- Used by `/api/auth/refresh` to get new access tokens
- Cleared by `/api/auth/revoke` on sign-out

### Token Refresh Mechanism
- `driveApiFetch()` in googleDrive.ts detects 401 responses
- Calls registered `tokenRefresher` callback (set by AuthProvider via `setTokenRefresher()`)
- `refreshAccessToken()` in useAuth.tsx calls `POST /api/auth/refresh` with `credentials: 'include'`
- Server reads HTTP-only cookie, calls Google's token endpoint, returns new access_token
- Deduplication via `refreshPromiseRef` prevents concurrent refresh requests
- On 401 failure after refresh attempt, throws `'Session expired'` — Layout shows reconnect banner

## Returning User Flow (Page Refresh)

```
Page loads
  → AuthProvider.init() runs
  → Identity restored from localStorage → setUser()
  → loading = true
  → waitForGIS() waits for script
  → initCodeClient() for authorization code flow
  → POST /api/auth/refresh (reads HTTP-only cookie, no popup needed)
  → If succeeds: setAccessToken(), setLoading(false)
  → If fails (no cookie / expired): setLoading(false), user sees reconnect banner
  → User can tap "Reconnect" which tries server refresh then falls back to code flow popup
```

## Why Authorization Code Flow?

The previous **implicit token flow** (`initTokenClient`) had a critical flaw:

1. It only returns access tokens (1-hour expiry), never refresh tokens
2. Silent refresh via hidden popups/iframes is blocked on mobile Safari
3. When refresh failed, the app wiped localStorage and reloaded, fully logging the user out
4. No amount of timeout/fallback tweaking could fix this — the implicit flow is architecturally incapable of persistent sessions

The **authorization code flow** fixes this because:
1. The auth code is exchanged server-side for both access + refresh tokens
2. The refresh token is stored in an HTTP-only cookie (7 days)
3. Token refresh is a simple HTTP POST — no popups, works on all browsers
4. Sessions persist across page reloads, browser restarts, and mobile Safari

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Frontend (.env.local) | Google OAuth client ID |
| `GOOGLE_CLIENT_ID` | Vercel env vars | Same value, for serverless functions |
| `GOOGLE_CLIENT_SECRET` | Vercel env vars | Google OAuth client secret (server only) |

## Auth Context API

The `useAuth()` hook exposes:

| Property | Type | Description |
|----------|------|-------------|
| `user` | `GoogleUser \| null` | Identity (email, name, picture) |
| `accessToken` | `string \| null` | Current Drive API token |
| `loading` | `boolean` | True during initial auth setup |
| `error` | `string \| null` | Auth error message |
| `signIn` | `() => void` | Trigger code flow popup |
| `signOut` | `() => void` | Clear identity, token, and server cookie |
| `requestToken` | `(prompt?) => Promise<string \| null>` | `''` = server refresh, `'consent'` = code flow popup |

## Email Whitelist

Authorized users are checked in two places:
1. **Client-side** (optional pre-check): `isAuthorizedUser()` in `src/services/googleAuth.ts`
2. **Server-side** (authoritative): `ALLOWED_EMAILS` in `api/auth/_utils.ts`

```typescript
const ALLOWED_EMAILS = [
  'carlosmartinezt@gmail.com',
  'lisvette.villar@gmail.com',
  'cjmartinez@meta.com',
];
```

Unauthorized users get a 403 from the exchange endpoint.

## Custom Folder Picker

The Google Picker iframe was replaced with a custom `FolderPicker` component (`src/components/ui/FolderPicker.tsx`).

- Full-screen modal on mobile, centered panel on desktop
- Browsable folder tree starting at "My Drive" (`'root'` as parent ID)
- Breadcrumb navigation for path history
- Uses React Query with `listFolders()` — each folder level cached independently
- Rendered via `createPortal` to avoid z-index issues with header/nav
- Resets to root on every open
- `SettingsPage` handles token acquisition before opening the picker:
  1. If `accessToken` exists, open immediately
  2. Try server-side refresh (`requestToken('')`)
  3. Fall back to code flow popup (`requestToken('consent')`) with `pendingPicker` state

## Local Development

Run the Vite dev server and Vercel dev server in separate terminals:

```bash
npm run dev              # Frontend on localhost:5173
npx vercel dev --listen 3000  # API functions on localhost:3000
```

Vite proxies `/api` requests to `localhost:3000` (configured in `vite.config.ts`).
