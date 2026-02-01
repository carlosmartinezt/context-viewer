# Architecture

## System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser/PWA   │────▶│  Vercel Edge     │────▶│  Google Drive   │
│   (React SPA)   │◀────│  (Serverless)    │◀────│  (Markdown)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   USCF API       │
                        │ (ratings proxy)  │
                        └──────────────────┘
```

## Data Flow

### 1. Authentication Flow
```
User clicks Login
    → Redirect to Google OAuth (implicit grant, response_type=token)
    → Google redirects back with access_token in URL hash
    → AuthProvider.parseOAuthCallback() extracts token
    → Fetch user info from Google userinfo API
    → Validate email against ALLOWED_EMAILS whitelist
    → Store user in localStorage, set auth state
```

### 2. Reading Chess Data
```
HomePage mounts
    → useQuery('chessFolder') → findChessFolder(accessToken)
        → Google Drive API: search for folder named "chess"
        → Returns folderId

    → useQuery('chessData') → fetchChessData(accessToken, folderId)
        → Google Drive API: find chess.md file
        → Google Drive API: download file content
        → chessParser.parseChessFile(content)
            → Parse markdown tables → players[], onlineAccounts[]
        → Returns { players, goals, onlineAccounts }
```

### 3. USCF Rating Refresh
```
User taps refresh button
    → fetchUSCFRating(uscfId)
        → Fetch /api/uscf-rating?id={uscfId}
            → Vercel serverless function (api/uscf-rating.ts)
            → Proxies to https://ratings-api.uschess.org/api/v1/members/{id}
            → Returns { regular, quick, blitz, fetchedAt }
    → saveRatingToCache(accessToken, folderId, uscfId, data)
        → Read existing ratings-cache.json from Drive (or create new)
        → Update with new rating
        → Write back to Drive
    → Update React state
```

### 4. Write Flow (Claude only - website is read-only)
```
User speaks/types request in VoiceInput
    → (Future) Send to Claude/OpenClaw
    → Claude updates markdown files in Google Drive
    → Website re-fetches on next load
```

## Key Files

| Layer | File | Purpose |
|-------|------|---------|
| API | `api/uscf-rating.ts` | Serverless proxy for USCF (avoids CORS) |
| Auth | `src/services/googleAuth.ts` | OAuth redirect flow, whitelist |
| Data | `src/services/googleDrive.ts` | Drive API read/write |
| Parse | `src/services/parsers/*.ts` | Markdown → TypeScript objects |
| Cache | `src/services/ratingsCache.ts` | USCF ratings in Drive JSON |
| State | `src/hooks/useAuth.tsx` | Auth context provider |

## External APIs

| API | Endpoint | Auth | Notes |
|-----|----------|------|-------|
| Google Drive | `googleapis.com/drive/v3` | OAuth Bearer token | Read markdown, write cache |
| Google UserInfo | `googleapis.com/oauth2/v3/userinfo` | OAuth Bearer token | Get email for whitelist |
| USCF Ratings | `ratings-api.uschess.org/api/v1/members/{id}` | None (public) | Must proxy via serverless |
