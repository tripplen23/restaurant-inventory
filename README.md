# Restaurant Inventory — Kitchen Stock

Web app for restaurant ingredient management, designed for iPad + Apple Pencil in a kitchen environment (gloves, cold storage, fast input).

## Features

- **Stock screen** — product grid with color-coded stock badges (OK / Low)
- **Stock In / Out** — inline quantity inputs (decimal 0.25, 0.5 OK), submit with Enter
- **Full CRUD** — add / edit / delete products directly from the Stock page
- **History** — transactions grouped by day and shift (Morning / Afternoon / Evening)
- **Reorder** — auto-lists items below threshold, print-friendly
- **Reports** — total in / out / current stock, 30-day average, depletion forecast
- **Add Product** — staff can add new ingredients on the fly
- **i18n** — English + 中文 (Chinese) with cookie-based locale toggle in the nav bar

## Tech

- Next.js 14 (App Router) + TypeScript + Tailwind
- **libSQL** (`@libsql/client`) — works with Turso (cloud) for production OR local file for dev
- next-intl 4.x for i18n (cookie-based locale, no URL prefix)
- iPad Safari: locked viewport (no zoom), touch targets ≥ 56px, fonts ≥ 20pt, haptic feedback

## Run locally

```bash
git clone https://github.com/tripplen23/restaurant-inventory.git
cd restaurant-inventory
npm install
npm run dev
```

Open `http://localhost:3000` in Safari (or any browser).

By default, the app uses a local SQLite file at `.data/inventory.db` — zero setup, just `npm run dev`.

To test on a real iPad over WiFi:

```bash
# find your machine's local IP, then open http://<IP>:3000 on iPad Safari
hostname -I
```

The dev server binds to all interfaces by default.

## Deploy to Vercel + Turso

This app uses **libSQL** so it can deploy to Vercel serverless (where filesystem is read-only and ephemeral).

### 1. Set up Turso (free tier: 9GB, 500M row reads/month)

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso   # macOS
# or: curl -sSfL https://get.turso.sh | sh

# Login + create database
turso auth login
turso db create restaurant-inventory

# Get connection URL + create auth token
turso db show restaurant-inventory --url
turso db tokens create restaurant-inventory
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Option A: CLI
vercel

# Option B: connect your GitHub repo at https://vercel.com/new
#   - Framework: Next.js (auto-detected)
#   - Build/Output: defaults are fine — no extra config
```

### 3. Add environment variables in Vercel dashboard

Project → Settings → Environment Variables:

| Name | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://restaurant-inventory-<your-org>.turso.io` |
| `TURSO_AUTH_TOKEN` | (token from `turso db tokens create`) |

Hit **Deploy** (or **Redeploy** if the first build is already done).

**That's it.** No Build & Output Settings need to change — leave all the Next.js defaults.

## Database modes

| Mode | When | How |
|---|---|---|
| **Turso cloud** | Production / Vercel | Set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` |
| **Local file** | Development / no env vars | Auto-falls-back to `.data/inventory.db` |

The schema is auto-migrated on first connect from `lib/server/schema.sql`. 5 default products are seeded if the table is empty.

## Project layout

```
app/
  page.tsx                    Stock screen (Burger-King-style inline In/Out)
  transaction/[id]/page.tsx   Detail page (legacy, also functional)
  history/page.tsx            History by day / shift
  reorder/page.tsx            Reorder list
  reports/page.tsx            Reports + aggregation
  add-product/page.tsx        Add product form
  api/
    products/                 GET, POST, PATCH, DELETE
    products/[id]/            PATCH, DELETE
    transactions/             GET, POST
    reports/                  GET aggregated
    locale/                   POST — set NEXT_LOCALE cookie
  middleware.ts               Cookie-based locale helper
components/
  Nav.tsx                     5-tab nav + EN | 中 locale toggle
  StockBadge.tsx              Color-coded stock badge
  NumPad.tsx                  Large on-screen numpad (transaction page)
i18n/
  request.ts                  next-intl config (load messages by locale)
messages/
  en.json                     English strings
  zh.json                     Chinese (中文) strings
lib/
  client-helpers.ts           classifyStock, getStockBadge (client-safe, no DB import)
  server/                     Server-only code
    db.ts                     libSQL/Turso singleton + dbAll/dbFirst/dbRun helpers
    schema.sql                Auto-applied on first connect
    seed.ts                   5 default products
    reports.ts                Aggregation logic (async)
  types.ts                    Shared TypeScript types
```

## Default products

| Name         | Unit | Threshold |
|--------------|------|-----------|
| Tomato       | box  | 1         |
| Green Salad  | box  | 0.5       |
| Broccoli     | box  | 0.5       |
| Carrot       | box  | 1         |
| Bell Pepper  | box  | 0.5       |

Staff can add any other ingredient via the "Add" tab.

## iPad notes

- Designed for iPad in landscape at 1024×768 or larger
- Touch targets are 80×80px minimum (works through food-prep gloves)
- Font sizes are 18pt+ for legibility
- Inline quantity inputs are the primary input method — no stylus or handwriting recognition needed
- Browser haptic feedback (`navigator.vibrate`) on successful save
- Locale toggle (EN | 中) in the top-right of the nav bar — works without page reload
