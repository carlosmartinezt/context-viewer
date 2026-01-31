# Chess Tracker - Application Design

## Core Philosophy

**Markdown files in Google Drive are the single source of truth.** Claude is the intelligence layer that understands natural language and updates these files. The website is a read-only dashboard with voice/text capture.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
│                                                                      │
│   Google Drive (~/gdrive/02_areas/chess/)                           │
│   ├── chess.md        (player profiles, ratings, goals)             │
│   ├── coaches.md      (coach info, contact, rates)                  │
│   ├── training.md     (weekly schedule, lessons)                    │
│   ├── curriculum.md   (learning topics, progress)                   │
│   └── tournaments.md  (calendar, travel, results)                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ reads/writes
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      INTELLIGENCE LAYER                              │
│                                                                      │
│   Claude (via Terminal or OpenClaw)                                 │
│   • Understands natural language requests                           │
│   • Knows the markdown file structure                               │
│   • Makes intelligent updates to files                              │
│   • Can prepare lesson plans, suggest rescheduling, etc.            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ natural language requests
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                              │
│                                                                      │
│   Chess Tracker Website (this app)                                  │
│   • READ-ONLY dashboard showing current state                       │
│   • Voice/text capture for requests                                 │
│   • Mobile-friendly for quick lookups                               │
│   • NO direct editing of data                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## User Personas & Workflows

### Jenny (Primary User - Mom/Manager)

**Typical interactions:**

1. **Quick lookup** (website)
   - "When is Rory's next lesson?"
   - "What tournament is coming up?"
   - Check weekly schedule on phone

2. **Making changes** (voice → Claude)
   - "Coach Mike canceled Thursday. Move Rory to Friday 4pm."
   - "Add a new tournament: Bay Area Open, March 15th, need hotel."
   - "Rory learned the Italian Game today, mark it complete."

3. **Getting help** (Claude conversation)
   - "Prepare talking points for Rory's lesson with Coach Mike"
   - "What should we focus on before the tournament?"
   - "Summarize Rory's progress this month"

### How Changes Flow

```
Jenny speaks: "Coach Mike canceled Rory's Thursday lesson,
              move it to Friday at 4pm"
                    │
                    ▼
         ┌─────────────────────┐
         │  Voice Capture      │
         │  (Website or Phone) │
         └─────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Claude Processing  │
         │  (Terminal/OpenClaw)│
         │                     │
         │  1. Parse request   │
         │  2. Read training.md│
         │  3. Find Thursday   │
         │  4. Move to Friday  │
         │  5. Update file     │
         └─────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Google Drive       │
         │  training.md updated│
         └─────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Website refreshes  │
         │  Shows new schedule │
         └─────────────────────┘
```

## Website Features

### What the Website DOES

| Feature | Description |
|---------|-------------|
| **Dashboard** | At-a-glance view of upcoming lessons, tournaments, recent activity |
| **Schedule View** | Weekly calendar of all chess activities |
| **Player Cards** | Each kid's current ratings, goals, progress |
| **Coach Directory** | Contact info, rates, lesson history |
| **Tournament Calendar** | Upcoming events with travel/logistics |
| **Voice Capture** | Record requests to be processed by Claude |
| **Text Input** | Type requests for Claude processing |

### What the Website DOES NOT DO

- ❌ Direct editing of any data via forms
- ❌ CRUD operations on database
- ❌ Running Claude directly (delegates to external service)
- ❌ File uploads or media management

## Integration Options

### Option 1: Terminal Claude (Current/Simple)

```
Website captures voice → Saved as text note
Carlos runs: claude "process chess request: [text]"
Claude updates files on local machine (GDrive mounted)
Website shows updated data on next refresh
```

**Pros:** Simple, works now, full Claude capabilities
**Cons:** Manual step required, not real-time

### Option 2: OpenClaw Integration (Future)

```
Website captures voice → POST to OpenClaw server
OpenClaw runs Claude with request
Claude updates files (server has GDrive access)
Website polls/refreshes to show updates
```

**Pros:** Automated, Jenny can use without Carlos
**Cons:** Requires server setup, security considerations

### Option 3: Hybrid with Webhooks (Advanced)

```
Website captures voice → Stores in queue
Claude Code running on Mac watches queue
Processes requests automatically
Triggers webhook to refresh website
```

## Voice/Text Input Design

### Input Component

```
┌────────────────────────────────────────────┐
│  🎤  What's happening with chess?          │
│                                            │
│  [Voice input waveform or text area]       │
│                                            │
│  Examples:                                 │
│  • "Cancel Thursday's lesson"              │
│  • "Add tournament March 15"               │
│  • "Rory's rating is now 1200"             │
│                                            │
│            [Submit to Claude]              │
└────────────────────────────────────────────┘
```

### Request Queue (if async processing)

```
┌────────────────────────────────────────────┐
│  Pending Requests                          │
│                                            │
│  ⏳ "Move Thursday lesson to Friday"       │
│     Submitted 2 min ago                    │
│                                            │
│  ✅ "Add Bay Area Open tournament"         │
│     Completed 1 hour ago                   │
│                                            │
└────────────────────────────────────────────┘
```

## Data Model (Markdown Files)

### chess.md - Player Profiles

```markdown
# Chess Tracker

## Players

### Rory
- **Age:** 10
- **USCF Rating:** 1150
- **Chess.com:** rory_chess (1200 rapid)
- **Goals:**
  - Reach 1300 by summer
  - Win trophy at Bay Area Open
- **Strengths:** Tactics, quick calculation
- **Working on:** Endgames, time management

### [Other players...]
```

### training.md - Schedule

```markdown
# Training Schedule

## Weekly Schedule

### Monday
- 4:00 PM - Puzzles (30 min)
- 4:30 PM - Online games (30 min)

### Thursday
- 4:00 PM - Lesson with Coach Mike (Rory)
- 5:00 PM - Lesson with Coach Mike (Sibling)

### Saturday
- 10:00 AM - Tournament practice

## Upcoming Lessons

| Date | Time | Player | Coach | Focus |
|------|------|--------|-------|-------|
| Jan 30 | 4pm | Rory | Mike | Endgames |
| Feb 1 | 4pm | Rory | Mike | Tournament prep |
```

### coaches.md - Coach Directory

```markdown
# Coaches

## Coach Mike
- **Email:** mike@chess.com
- **Phone:** 555-1234
- **Rate:** $60/hour
- **Specialty:** Tactics, tournament preparation
- **Availability:** Thu 4-6pm, Sat 10am-12pm
- **Notes:** Great with kids, very patient
```

### tournaments.md - Events

```markdown
# Tournaments

## Upcoming

### Bay Area Open - March 15, 2025
- **Location:** San Jose Convention Center
- **Sections:** K-8 U1200, K-8 U1000
- **Registration:** [link]
- **Status:** Registered (Rory - U1200)
- **Travel:**
  - [ ] Book hotel (Holiday Inn nearby)
  - [ ] Pack chess set
  - [ ] Print directions

## Past Results

### Winter Classic - Jan 10, 2025
- Rory: 3.5/5, won trophy (2nd place U1200)
```

## Security Considerations

1. **Google OAuth** - Only whitelisted accounts can view
2. **Read-only by default** - Website cannot modify files directly
3. **Claude access** - Only runs on trusted machines/servers
4. **Voice data** - Processed locally or via secure channel

## Future Enhancements

1. **Push notifications** - "Lesson in 1 hour"
2. **Rating tracking** - Auto-fetch from USCF/Chess.com
3. **Shared calendar** - Export to Google Calendar
4. **Coach portal** - Coaches can view their schedule
5. **Progress reports** - Monthly summaries generated by Claude
