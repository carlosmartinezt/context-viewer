# ♟️ Chess Website for Jenny

> A web app for Jenny to view and edit the kids' chess training plans, schedules, coaches, and tournaments.

---

## 🚀 Current Progress

**Status:** ✅ OAuth configured, ready to test Drive API integration

**Code location:** `~/Workspace/chess-tracker/`

| Phase | Status |
|-------|--------|
| Phase 1: Core Setup | ⏳ In Progress (OAuth ✅, Drive API testing next) |
| Phase 2: Editing | ❓ Not started |
| Phase 3: Polish & Mobile | ❓ Not started |
| Phase 4: Reminders | ❓ Not started |

### What's Built

- ✅ Vite + React + TypeScript project
- ✅ TailwindCSS with mobile-first design
- ✅ Routing (Home, Coaches, Tournaments, Curriculum, Settings)
- ✅ Google OAuth flow (UI + Client ID configured)
- ✅ Google Cloud project with Drive API enabled
- ✅ Whitelist configured (Carlos + Jenny)
- ✅ Google Drive service (scaffolded, ready to test)
- ✅ Placeholder pages with mock data
- ✅ Bottom navigation, card layout
- ✅ GitHub repository connected

### Next Steps

1. ~~Set up Google Cloud project + OAuth credentials~~ ✅ Done
2. ~~Add Client ID to `.env.local`~~ ✅ Done
3. ~~Add Jenny's email to whitelist~~ ✅ Done
4. **Test Drive API integration** ⬅️ Next
5. Build markdown parsing for chess files
6. Connect UI to real Drive data

---

## 🎯 Goals

- Jenny can view/edit chess files from any device (phone, tablet, laptop)
- No content duplication — read/write directly to Google Drive
- Simple, clean UI focused on the chess training workflow
- Carlos maintains, Jenny uses

---

## 📁 Source Data

**Location:** `~/gdrive/claude/02_areas/chess/`

| File | Content |
|------|---------|
| `chess.md` | Player overview, ratings, goals |
| `curriculum.md` | Topics, openings, tactics to learn |
| `training.md` | Weekly schedule, puzzles, practice |
| `coaches.md` | Coach info, lesson calendar |
| `tournaments.md` | Tournament calendar, travel, results |

---

## 🏗️ Architecture Options

### Option A: React SPA + Google Drive API (Recommended) ⭐

```
┌─────────────────────────────────────────────────────┐
│  React SPA (Vite)                                   │
│  ├── Google OAuth (Jenny's account)                 │
│  ├── Google Drive API (read/write .md files)        │
│  └── Markdown parser/editor                         │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Google Drive                                       │
│  └── 02_areas/chess/*.md                            │
└─────────────────────────────────────────────────────┘
```

**Pros:**
- No backend needed
- No content duplication (direct read/write)
- Free hosting (Vercel/Cloudflare Pages)
- Simple architecture

**Cons:**
- Requires Google OAuth setup
- Jenny must have Drive access to the chess folder
- Client-side only (no server caching)

**Stack:**
- React + Vite (or Next.js static export)
- Google Identity Services (OAuth 2.0)
- Google Drive API v3
- `react-markdown` + `remark-gfm` for rendering
- Custom form components for editing

---

### Option B: Next.js + Server-Side Drive Access

```
┌─────────────────────────────────────────────────────┐
│  Next.js App                                        │
│  ├── React frontend                                 │
│  ├── API routes (server-side)                       │
│  │   └── Google Drive API (service account)         │
│  └── Optional: SQLite cache                         │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Google Drive (via service account or OAuth)        │
└─────────────────────────────────────────────────────┘
```

**Pros:**
- More control over caching/sync
- Can add features like notifications, history
- Service account = no user login needed (if Drive shared with it)

**Cons:**
- Needs backend hosting (Vercel serverless, Railway, etc.)
- More complex setup
- Service account needs Drive folder shared with it

**Stack:**
- Next.js (App Router)
- Google APIs Node.js client
- Optional: SQLite (Turso) or Postgres for cache
- Vercel for hosting

---

### Option C: Local-First with Background Sync

```
┌─────────────────────────────────────────────────────┐
│  React SPA                                          │
│  ├── IndexedDB for local storage                    │
│  └── Background sync worker                         │
└─────────────────────────────────────────────────────┘
         │ (periodic sync)
         ▼
┌─────────────────────────────────────────────────────┐
│  Sync Server (Node.js)                              │
│  └── Google Drive API                               │
└─────────────────────────────────────────────────────┘
```

**Pros:**
- Works offline
- Fast (local-first)

**Cons:**
- Complex sync logic
- Conflict resolution needed
- Overkill for this use case

---

## ✅ Recommendation: Option A

For the initial version, **Option A (React SPA + Drive API)** is the best fit:
1. Matches your constraint of no duplication
2. Free hosting
3. Simple to build and maintain
4. You're comfortable with React

Can evolve to Option B later if you need caching or advanced features.

---

## 🛠️ Implementation Plan

### Phase 1: Core Setup

| Task | Description |
|------|-------------|
| Create Vite + React project | TypeScript, TailwindCSS |
| Set up Google Cloud project | Enable Drive API, configure OAuth consent |
| Implement Google OAuth | Login flow for Jenny |
| Drive API integration | Read files from chess folder |
| Markdown rendering | Display chess files nicely |

### Phase 2: Editing

| Task | Description |
|------|-------------|
| Edit mode for each file | Form-based editing (not raw markdown) |
| Save back to Drive | Write updated markdown |
| Validation | Ensure data integrity |
| Mobile-friendly UI | Jenny uses phone often? |

### Phase 3: Polish & Mobile

| Task | Description |
|------|-------------|
| PWA support | Install on phone home screen, works offline |
| Calendar view | Visual weekly/monthly schedule |
| Quick actions | Swipe to mark complete, add notes |
| Bottom navigation | Thumb-friendly mobile nav |

### Phase 4: Reminders

| Task | Description |
|------|-------------|
| Reminder system | See options below |
| Hotel booking alerts | "Book hotel for [Tournament] — 6 weeks out" |
| Lesson reminders | "Rapha has lesson with Kim Steven in 1 hour" |
| Tournament prep | "Pack checklist for [Tournament] tomorrow" |

---

## 🔔 Reminder Options

### Option R1: OpenClaw Integration (Recommended) ⭐

You already have OpenClaw running with WhatsApp connected. Add a scheduled job:

```
┌─────────────────────────────────────────────────────┐
│  OpenClaw (running on home server)                  │
│  ├── Cron job: Check chess files daily              │
│  ├── Parse tournaments.md for upcoming events       │
│  ├── Calculate "book hotel by" dates (6 weeks out)  │
│  └── Send WhatsApp reminders to Carlos & Jenny      │
└─────────────────────────────────────────────────────┘
```

**Pros:**
- Already running, already connected to WhatsApp
- No additional services needed
- Can send rich, conversational reminders
- Free

**Cons:**
- Requires home server running 24/7
- Custom development needed

### Option R2: Vercel Cron + Email

```
┌─────────────────────────────────────────────────────┐
│  Vercel Cron Job (runs daily)                       │
│  ├── Read chess files from Drive                    │
│  └── Send email via Resend/SendGrid                 │
└─────────────────────────────────────────────────────┘
```

**Pros:**
- No home server dependency
- Email is reliable

**Cons:**
- Vercel free tier: 1 cron job, runs max once/day
- Email less immediate than WhatsApp
- Resend free tier: 100 emails/month

### Option R3: PWA Push Notifications

```
┌─────────────────────────────────────────────────────┐
│  Website (PWA)                                      │
│  ├── Service worker with push notifications         │
│  └── Vercel cron triggers push                      │
└─────────────────────────────────────────────────────┘
```

**Pros:**
- Native-feeling notifications
- Works on phone

**Cons:**
- More complex setup
- Requires push notification service
- Less reliable than WhatsApp/email

### ✅ Decision: R1 + R2 (Both)

**Primary:** OpenClaw → WhatsApp (immediate, conversational)
**Backup:** Vercel Cron → Email (reliable, works if OpenClaw is down)

Sample reminder flow:
1. You add tournament to `tournaments.md`: "State Championship, Albany, March 15, Book Hotel By: Feb 1"
2. **OpenClaw** reads file daily, sees "Book Hotel By" date approaching
3. Sends **WhatsApp**: "🏨 Reminder: Book hotel for State Championship (Albany, March 15) — 6 weeks out. Want me to search for hotels?"
4. **Vercel cron** sends **email** as backup/reminder log

---

## 🌐 Hosting: Vercel

**Why Vercel:**
- ✅ Free tier is generous (100GB bandwidth, unlimited sites)
- ✅ Extremely fast — global edge network
- ✅ Git-based deploys (push to GitHub = auto deploy)
- ✅ Great for React/Next.js
- ✅ Free subdomain: `chess-tracker.vercel.app`

**Free tier limits:**
- 100GB bandwidth/month (plenty for personal use)
- 1 cron job (can run once/day)
- Serverless functions: 100GB-hours/month

**Domain options:**
| Option | Cost | Example |
|--------|------|---------|
| Free subdomain | $0 | `chess-tracker.vercel.app` |
| Custom domain | ~$10-15/year | `chess.carlosmartinezt.com` |

**Recommendation:** Start with free subdomain, add custom domain later if wanted

---

## 🔐 Google Cloud Setup

### Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: `chess-tracker` (or similar)
3. Enable **Google Drive API**
4. Configure **OAuth consent screen**
   - User type: External (or Internal if using Workspace)
   - Add scopes: `drive.file` or `drive.readonly` + `drive`
5. Create **OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized origins: `http://localhost:5173`, `https://chess.yourdomain.com`
   - Authorized redirect URIs: same
6. Save Client ID and Secret

### Scopes Needed

| Scope | Purpose |
|-------|---------|
| `https://www.googleapis.com/auth/drive.file` | Read/write files created by the app |
| `https://www.googleapis.com/auth/drive.readonly` | Read all files (if not restricting) |

**Note:** To access existing files (not created by app), need `drive` or share folder with service account.

---

## 📦 Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-router-dom": "^6.x",
    "react-markdown": "^9.x",
    "remark-gfm": "^4.x",
    "@tanstack/react-query": "^5.x",
    "googleapis": "^140.x"
  }
}
```

---

## 🎨 UI Mockup (Mobile-First)

```
┌────────────────────────────┐
│  ♟️ Chess Tracker    [👤]   │
├────────────────────────────┤
│                            │
│  ┌──────────┐ ┌──────────┐ │
│  │ 👧 Rapha │ │ 👦 Rory  │ │
│  │   1700   │ │   900    │ │
│  └──────────┘ └──────────┘ │
│                            │
│  📅 This Week              │
│  ┌────────────────────────┐│
│  │ Mon 2/3 · 4pm          ││
│  │ Rapha → Kim Steven     ││
│  │ Tactics                ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │ Wed 2/5 · 5pm          ││
│  │ Rory → Yeisson         ││
│  │ Openings               ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │ 🏆 Sat 2/8 · 9am       ││
│  │ Brooklyn Scholastic    ││
│  │ Both kids              ││
│  └────────────────────────┘│
│                            │
│  [+ Lesson] [+ Tournament] │
│                            │
├────────────────────────────┤
│ 📅    🎓    🏆    📚    ⚙️  │
│ Home Coach Tourn Curric Set│
└────────────────────────────┘
```

**Mobile features:**
- Bottom navigation (thumb-friendly)
- Large tap targets
- Card-based layout
- Swipe actions (mark complete, edit)

---

## ✅ Decisions Made

| Question | Answer |
|----------|--------|
| **Domain** | Free Vercel subdomain (`chess-tracker.vercel.app`) — custom domain later if wanted |
| **Mobile priority** | Yes — Jenny uses phone primarily, design mobile-first |
| **Notifications** | Yes — hotel booking reminders for national/state tournaments |
| **Auth** | Google OAuth — only Carlos & Jenny's Google accounts allowed |
| **Multi-user** | Both Carlos and Jenny |
| **Reminder channels** | WhatsApp (via OpenClaw) + Email (backup) |

---

## 📜 Changelog

| Date | Change |
|------|--------|
| 2025-01-31 | Created initial plan |
| 2025-01-31 | Added mobile-first design, Vercel details, reminder options (OpenClaw integration) |
| 2025-01-31 | Finalized decisions: Google Auth, both users, WhatsApp + Email reminders |
| 2026-01-31 | **Scaffolded project** at `~/Workspace/chess-tracker/` — Vite + React + TailwindCSS + routing + auth flow |
| 2026-01-31 | **OAuth configured** — Google Cloud project setup, Client ID added, whitelist configured (Carlos + Jenny) |
| 2026-01-31 | **GitHub connected** — Created private repo at `carlosmartinezt/chess-tracker` |
