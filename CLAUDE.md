# CLAUDE.md — Technical Context for AI Assistants

> For the full project vision, features, and roadmap see `../PROJECT_BRIEF.md`

## What This Project Is
A map-based directory of **university programs in sustainability and design**. Users browse an interactive world map, filter by discipline/level/country/etc., click pins to see program details, and can submit new programs via a form. Data lives in a Google Sheet.

## Key Facts
- **Owner**: Wolfram (non-technical — Claude handles all code, explains terminal commands step by step)
- **Map data maintainer**: Wolfram's friend (edits the Google Sheet, approves submissions via email)
- **Status**: Early development (MVP phase)
- **Hosting**: Vercel (free tier)
- **Domain**: TBD
- **Repo**: TBD (not yet on GitHub)
- **Dev server port**: Use `-p 3002` (ports 3000 and 3001 are taken on Wolfram's machine)

## Tech Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | React + Vercel integration |
| Language | TypeScript | Type safety |
| Map | Leaflet + react-leaflet | Free, no API key needed |
| Clustering | react-leaflet-cluster (TBD) | Country → city → pin zoom behavior |
| Tiles | TBD (evaluating styles) | Moving away from default OSM |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Data source | Google Sheet → published CSV | Owner edits sheet, site auto-updates |
| CSV parsing | Papa Parse | Robust CSV parsing |
| Geocoding | City+country → lat/lng lookup | No manual coordinates needed in sheet |
| Deployment | Vercel | Auto-deploy from GitHub |

## Project Structure
```
sustainability-map/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (font, metadata)
│   │   ├── page.tsx            # Main page (header + filters + map)
│   │   ├── globals.css         # Tailwind + Leaflet CSS
│   │   └── embed/
│   │       ├── layout.tsx      # Minimal embed layout (no chrome)
│   │       └── page.tsx        # Embed page (map only, URL param filtering)
│   ├── components/
│   │   ├── MapView.tsx         # Leaflet map with markers + popups + clustering
│   │   ├── FilterBar.tsx       # Search + multi-field filter UI
│   │   ├── ProgramCard.tsx     # (TODO) Detail card shown in popup
│   │   └── SubmissionForm.tsx  # (TODO) "Add a Program" form
│   ├── lib/
│   │   ├── data.ts             # Fetches & parses Google Sheet CSV
│   │   └── geocode.ts          # (TODO) City+country → lat/lng resolution
│   └── types/
│       └── location.ts         # Program TypeScript interface
├── public/                     # Static assets
├── .env.local                  # Environment variables (Sheet URL)
├── .env.example                # Template for env vars
├── next.config.mjs             # iframe headers for /embed route
├── tailwind.config.ts          # Brand colors
├── package.json
└── CLAUDE.md                   # This file
```

## Data Model (Google Sheet Columns)
Each row = one university program.

| Column | Type | Required | Filterable | Example |
|--------|------|----------|------------|---------|
| `institution` | text | yes | no (searchable) | "Royal College of Art" |
| `program` | text | yes | no (searchable) | "MA Sustainable Design" |
| `country` | text | yes | yes | "United Kingdom" |
| `city` | text | yes | yes | "London" |
| `level` | text | yes | yes | "Master" / "Bachelor" / "PhD" |
| `discipline` | text | yes | yes | "Design" / "Architecture" |
| `focus` | text | yes | yes | "Sustainability" / "Regenerative Design" |
| `language` | text | yes | yes | "English" |
| `duration` | text | yes | yes | "2 years" |
| `url` | URL | yes | no | Course page link |

**No lat/lng in the sheet.** Coordinates are resolved automatically from city + country.

## Map Behavior
- **Zoomed out**: Country-level clusters (bubble showing count of programs per country)
- **Zoomed in**: City-level clusters (bubble showing count per city)
- **Full zoom**: Individual pins, one per program
- Clicking a pin → popup card with program details + link
- Clicking a cluster → zooms in to reveal contents

## Routes
- `/` — Full standalone page (header + filters + search + map)
- `/embed` — Map only, no site chrome. Supports URL params: `?country=Germany&level=Master&discipline=Design`

## Environment Variables
- `NEXT_PUBLIC_SHEET_CSV_URL` — Published Google Sheet CSV URL

## Key Design Decisions
1. **Google Sheet as data source** — simple for the maintainer, no backend needed
2. **City-level geocoding** — programs don't need exact building locations; city precision is enough
3. **Leaflet over Google Maps** — free, no API key, no billing
4. **Client-side fetching** — CSV fetched in browser, cached ~5 min
5. **Dynamic import for MapView** — Leaflet doesn't support SSR
6. **Separate /embed route** — clean iframe experience, configurable via URL params
7. **Email-based submissions** — keeps it simple; form sends email to maintainer
8. **Map tile style** — TBD, moving to a cleaner/more artistic style (not default OSM)

## Commands
```bash
npm install                # Install dependencies
npm run dev -- -p 3002     # Start dev server on port 3002
npm run build              # Production build
npm run start -- -p 3002   # Start production server on port 3002
npm run lint               # Run ESLint
```

## Notes for Claude
- Wolfram is non-technical — always explain terminal commands step by step, starting from "open Terminal"
- Ports 3000 and 3001 are taken — always use port 3002
- Keep the Google Sheet as the data source — no database migrations unless explicitly discussed
- The /embed route must always work in iframes (check X-Frame-Options headers)
- Sample data is built into data.ts for development without a connected sheet
- When suggesting code changes, explain what they do in plain language
- The maintainer (Wolfram's friend) should never need to touch code — everything she does is in the Google Sheet or via email
