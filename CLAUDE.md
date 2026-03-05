# NomNow — Campus Free Food Finder

## Project Overview

NomNow helps students find (and post) free food events on campus. Users log in with their school account, browse a dashboard of active events, and view them on a live map with color-coded pins indicating timeliness.

Target: Deploy to Vercel for beta testing. No native app — web-first.

---

## Tech Stack

| Layer       | Choice                              | Reason                                      |
|-------------|-------------------------------------|---------------------------------------------|
| Framework   | Next.js 14 (App Router)             | Vercel-native, file-based routing, RSC      |
| Language    | TypeScript                          | Type safety for data models                 |
| Auth        | NextAuth.js (Auth.js v5)            | Google OAuth + email domain restriction     |
| Database    | Supabase (PostgreSQL)               | Free tier, Postgres, real-time subscriptions|
| Map         | Mapbox GL JS                        | Free tier generous, great React integration |
| Styling     | Tailwind CSS + shadcn/ui            | Fast UI iteration                           |
| Deployment  | Vercel                              | Zero-config, instant preview deploys        |

---

## Directory Structure

```
nomnow/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx            # Login page (school SSO)
│   ├── (app)/
│   │   ├── layout.tsx              # App shell with tab nav
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # Server wrapper (passes userId)
│   │   │   └── dashboard-view.tsx  # Client: event feed with filters
│   │   ├── map/
│   │   │   ├── page.tsx            # Server wrapper (passes campus config)
│   │   │   └── map-view.tsx        # Client: Mapbox map view
│   │   └── post/
│   │       └── page.tsx            # Create event form
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts            # NextAuth handler
│   │   └── events/
│   │       ├── route.ts            # GET /api/events, POST /api/events
│   │       └── [id]/
│   │           └── route.ts        # GET /api/events/:id, PATCH, DELETE
│   └── layout.tsx                  # Root layout
├── components/
│   ├── EventCard.tsx               # Dashboard event card
│   ├── EventMap.tsx                # Mapbox map component
│   ├── MapPin.tsx                  # Individual pin with color logic
│   ├── PostEventForm.tsx           # Create event form
│   └── TabNav.tsx                  # Dashboard / Map tab switcher
├── lib/
│   ├── auth.ts                     # NextAuth config
│   ├── campuses.ts                 # Campus config registry (domain→campus mapping)
│   ├── supabase.ts                 # Supabase client
│   ├── pinColor.ts                 # Time-to-color algorithm
│   └── types.ts                   # Shared TypeScript types
├── proxy.ts                       # Route protection (Next.js 16 middleware)
└── .env.local                      # Secrets (never commit)
```

---

## Data Models

### `users` table
```sql
id          uuid primary key default gen_random_uuid()
email       text unique not null
name        text
avatar_url  text
school      text
created_at  timestamptz default now()
```

### `events` table
```sql
id                uuid primary key default gen_random_uuid()
title             text not null
description       text
food_type         text[]              -- ["pizza", "sandwiches", etc.]
location_name     text not null       -- "Doe Library, Room 180"
lat               float8 not null
lng               float8 not null
start_time        timestamptz not null
end_time          timestamptz         -- nullable: open-ended events
expected_people   int
campus            text                -- derived from poster's email domain
posted_by         uuid references users(id)
created_at        timestamptz default now()
```

---

## Map Pin Color Algorithm

Located in `lib/pinColor.ts`.

The pin color is a smooth gradient based on the delta between `now` and `start_time`:

```
delta = start_time - now  (negative = past, positive = future)

PAST   (delta < -3h):  pure red      #FF0000
       (delta = -1h):  orange-red    #FF4400
       (delta =  0):   green         #00CC44  ← happening now
FUTURE (delta = +20m): greenish-blue #00CC99
       (delta = +1h):  teal-blue     #0099CC
       (delta = +3h):  blue          #0044FF
       (delta > +3h):  deep blue     #0000CC
```

Interpolation: use `lerp` between color stops based on minutes delta.
Cutoffs configurable via constants so they can be tuned per campus culture.

---

## Auth Flow

1. User hits `/login`
2. Clicks "Sign in with Google"
3. NextAuth redirects to Google OAuth
4. On callback, check email domain against campus registry in `lib/campuses.ts`
5. If domain matches a registered campus → upsert user in Supabase → redirect to `/dashboard`
6. If domain unrecognized → redirect back to `/login?error=unauthorized`

Allowed domains are defined in `lib/campuses.ts` (no env var needed).

---

## Campus Scoping

Users only see events from their own campus. Campus is derived automatically from the user's email domain at login — no manual selection needed.

**How it works:**
1. `lib/campuses.ts` maps email domains → campus config (`{ id, name, center, zoom }`)
2. On sign-in, `lib/auth.ts` calls `getCampusFromEmail(email)` and sets `users.school` to the campus id (e.g. `uiuc`)
3. The session callback attaches `school` as `session.user.campus`
4. `GET /api/events` filters by `campus = session.user.campus` when the user is logged in
5. `POST /api/events` auto-sets `campus` from the session
6. The map page reads the campus config to set center coordinates and zoom level

**Adding a new campus:** Add an entry to the `campusByDomain` map in `lib/campuses.ts`:
```ts
'berkeley.edu': {
  id: 'ucb',
  name: 'UC Berkeley',
  center: [-122.2585, 37.8719],
  zoom: 15,
},
```

**Edge cases:**
- Unrecognized email domain → `school = null`, user sees all events (safe fallback for dev)
- Existing users get `school` populated on next login via upsert
- Existing events backfilled via migration SQL; orphans with `campus = NULL` are visible to all

---

## API Routes

| Method | Path              | Auth | Description                    |
|--------|-------------------|------|--------------------------------|
| GET    | /api/events       | No   | List events (supports filters) |
| POST   | /api/events       | Yes  | Create a new event             |
| GET    | /api/events/:id   | No   | Get single event               |
| PATCH  | /api/events/:id   | Yes  | Edit own event                 |
| DELETE | /api/events/:id   | Yes  | Delete own event               |

GET /api/events query params:
- `lat`, `lng`, `radius` — filter by proximity
- `after`, `before` — filter by time window
- `limit`, `offset` — pagination

---

## Environment Variables

```env
# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Allowed email domains defined in lib/campuses.ts

# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Map
NEXT_PUBLIC_MAPBOX_TOKEN=
```

---

## Build Phases

### Phase 1 — MVP
- [x] Next.js project init with TypeScript + Tailwind + shadcn/ui
- [x] Supabase project: create tables, enable Row Level Security
- [x] NextAuth with Google OAuth + domain restriction
- [x] `POST /api/events` + `GET /api/events`
- [x] Dashboard tab: list events as cards (title, location, time, food)
- [x] Map tab: Mapbox map + pins with color algorithm
- [x] Post event form (title, description, food type, location picker, time)
- [x] Deploy to Vercel

### Phase 2 — Polish
- [x] Event detail modal/page
- [x] Filter by food type or time on dashboard
- [x] Auto-refresh every 2 min (client-side polling via useEvents hook)
- [x] Mobile-responsive layout (bottom tab nav, safe area insets, viewport meta)
- [x] Campus-based event scoping (users only see events from their campus)

### Phase 2.5 — Beta Readiness
- [x] Rate limiting on POST /api/events (max 5 posts per user per hour)
- [x] Input validation/sanitization (length limits, XSS protection on title/description)
- [x] Verify own-event enforcement on PATCH/DELETE routes (posted_by === session.user.id)
- [x] Edit/delete own events from the UI (buttons on own event cards)
- [x] Empty states for dashboard and map ("No free food right now — be the first to post!")
- [x] Error/success feedback on post form (inline banner)
- [x] Auto-hide expired events (24h+ past start_time)
- [x] Loading/error states on dashboard page
- [x] Clean up stale ALLOWED_EMAIL_DOMAINS references (env var, CLAUDE.md, .env.example)
- [x] Fix CLAUDE.md directory structure (proxy.ts not middleware.ts, add map-view.tsx)

### Phase 3 — RSVP / Headcount (future)
- [ ] RSVP table + button on event card
- [ ] Expected vs. actual attendance counter
- [ ] Pin turns gray when attendance is "full"
- [ ] Push notifications for nearby events
- [ ] "Food's gone" reporting — any user can flag an event as depleted
- [ ] Relative timestamps on event cards ("5 min ago" instead of absolute time)

---

## Key Design Decisions

- **No native app**: web-first for fast beta on Vercel; PWA meta tags for home screen install
- **No password auth**: school Google OAuth only, keeps spam out
- **Supabase over Firebase**: SQL is easier for time-range queries on events
- **Mapbox over Google Maps**: cleaner React integration, no key billing surprises at low traffic
- **App Router over Pages Router**: better layout nesting for the two-tab structure
- **Campus scoping via email domain**: campus is derived automatically from the user's email domain at login (e.g. `@illinois.edu` → `uiuc`). No manual campus selection needed. Config lives in `lib/campuses.ts`

---

## Running Locally

```bash
npm install
cp .env.example .env.local   # fill in secrets
npm run dev
```
