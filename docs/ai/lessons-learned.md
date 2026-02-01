# Lessons Learned

Critical fixes and patterns discovered through debugging. Add new lessons here.

---

## OAuth & Authentication

### Lesson: Mobile OAuth requires redirect flow, not popup
**Problem:** `signInWithGoogle()` using popup-based flow (`requestAccessToken()`) hangs on mobile browsers with "Signing in..." forever.

**Fix:** Use redirect-based implicit grant flow:
```typescript
const params = new URLSearchParams({
  client_id: GOOGLE_CLIENT_ID,
  redirect_uri: window.location.origin,
  response_type: 'token',  // Implicit grant
  scope: SCOPES,
  state: 'login',
});
window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
```

### Lesson: Vercel env vars - use printf, not echo
**Problem:** `echo "value" | vercel env add VAR` adds a trailing newline, causing `invalid_client` OAuth errors.

**Fix:** Use `printf`:
```bash
printf '%s' 'your-client-id.apps.googleusercontent.com' | vercel env add VITE_GOOGLE_CLIENT_ID production
```

### Lesson: Google OAuth needs BOTH origins AND redirect URIs
**Problem:** `redirect_uri_mismatch` error on production.

**Fix:** In Google Cloud Console, add the URL to BOTH:
- Authorized JavaScript origins
- Authorized redirect URIs

---

## Vercel Deployment

### Lesson: SPA routing requires vercel.json rewrites
**Problem:** 404 errors when refreshing any page except `/`.

**Fix:** Create `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### Lesson: Vercel CLI path after npm install
**Problem:** `command not found: vercel` after `npm install -g vercel`.

**Fix:** Add to PATH:
```bash
export PATH="$HOME/.npm-global/bin:$PATH:$(npm config get prefix)/bin"
```

---

## USCF Ratings

### Lesson: Use MUIR API, not MSA
**Problem:** Old MSA system (`www.uschess.org/msa/`) has stale, outdated ratings.

**Fix:** Use new MUIR API:
```
https://ratings-api.uschess.org/api/v1/members/{uscfId}
```

### Lesson: USCF API requires CORS proxy
**Problem:** Browser can't call USCF API directly (CORS blocked).

**Fix:** Create serverless proxy at `api/uscf-rating.ts`:
```typescript
const response = await fetch(`https://ratings-api.uschess.org/api/v1/members/${id}`, {
  headers: { 'User-Agent': 'ChessTracker/1.0' }
});
```

### Lesson: localStorage doesn't persist across devices
**Problem:** User wanted ratings to persist across browsers/devices. localStorage is browser-specific.

**Fix:** Store in Google Drive instead. Created `ratings-cache.json` that syncs via Drive API.

---

## Markdown Parsing

### Lesson: Strip markdown formatting from table values
**Problem:** Platform column contained `**USCF**` (bold), but code looked for `USCF`. USCF accounts weren't found.

**Fix:** Use `stripMarkdown()` on table cell values:
```typescript
const platform = stripMarkdown(row.Platform || '');
```

---

## React Patterns

### Lesson: React Query initialData for cached values
When loading cached data (from localStorage or Drive) into React Query:
```typescript
useQuery({
  queryKey: ['key'],
  queryFn: fetchData,
  initialData: cachedValue,  // Show cached immediately
});
```

---

## Template for New Lessons

```markdown
### Lesson: [Short title]
**Problem:** [What went wrong]

**Fix:** [How to fix it]
```
