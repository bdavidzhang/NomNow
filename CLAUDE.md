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
│   │   │   └── page.tsx            # Event feed
│   │   ├── map/
│   │   │   └── page.tsx            # Mapbox map view
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
│   ├── supabase.ts                 # Supabase client
│   ├── pinColor.ts                 # Time-to-color algorithm
│   └── types.ts                   # Shared TypeScript types
├── middleware.ts                   # Route protection
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
4. On callback, check `email` ends with allowed domain (e.g. `@berkeley.edu`)
5. If domain valid → upsert user in Supabase → redirect to `/dashboard`
6. If domain invalid → redirect back to `/login?error=unauthorized`

Domain allow-list is set via `ALLOWED_EMAIL_DOMAINS` env var (comma-separated).

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
ALLOWED_EMAIL_DOMAINS=berkeley.edu,mit.edu   # comma-separated

# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Map
NEXT_PUBLIC_MAPBOX_TOKEN=
```

---

## Build Phases

### Phase 1 — MVP (build this first)
- [ ] Next.js project init with TypeScript + Tailwind + shadcn/ui
- [ ] Supabase project: create tables, enable Row Level Security
- [ ] NextAuth with Google OAuth + domain restriction
- [ ] `POST /api/events` + `GET /api/events`
- [ ] Dashboard tab: list events as cards (title, location, time, food)
- [ ] Map tab: Mapbox map + pins with color algorithm
- [ ] Post event form (title, description, food type, location picker, time)
- [ ] Deploy to Vercel

### Phase 2 — Polish
- [ ] Real-time pin updates (Supabase Realtime → refresh map)
- [ ] Event detail modal/page
- [ ] Filter by food type or time on dashboard
- [ ] Pull-to-refresh / auto-refresh every 2 min
- [ ] Mobile-responsive layout

### Phase 3 — RSVP / Headcount (future)
- [ ] RSVP table + button on event card
- [ ] Expected vs. actual attendance counter
- [ ] Pin turns gray when attendance is "full"
- [ ] Push notifications for nearby events

---

## Key Design Decisions

- **No native app**: web-first for fast beta on Vercel; PWA meta tags for home screen install
- **No password auth**: school Google OAuth only, keeps spam out
- **Supabase over Firebase**: SQL is easier for time-range queries on events
- **Mapbox over Google Maps**: cleaner React integration, no key billing surprises at low traffic
- **App Router over Pages Router**: better layout nesting for the two-tab structure

---

## Running Locally

```bash
npm install
cp .env.example .env.local   # fill in secrets
npm run dev
```
