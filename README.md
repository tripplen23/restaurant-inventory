# Restaurant Inventory — Kitchen Stock

Web app for restaurant ingredient management, designed for iPad + Apple Pencil in a kitchen environment (gloves, cold storage, fast input).

## Features

- **Stock screen** — product grid with color-coded stock badges (green / red)
- **Stock In / Out** — large on-screen numpad (80×80px buttons), decimals supported (0.25, 0.33…)
- **History** — transactions grouped by day and shift (Morning / Afternoon / Evening)
- **Reorder** — auto-lists items below threshold, print-friendly
- **Reports** — total in / out / current stock, 14-day sparkline, depletion forecast
- **Add Product** — staff can add new ingredients on the fly

## Tech

- Next.js 14 (App Router) + TypeScript + Tailwind
- better-sqlite3 (file-based, zero setup)
- iPad Safari: locked viewport (no zoom), touch targets ≥ 80px, fonts ≥ 18pt, haptic feedback

## Run locally

```bash
cd restaurant-inventory
npm install
npm run dev
```

Open `http://localhost:3000` in Safari (or any browser).

To test on a real iPad over WiFi:

```bash
# find your machine's local IP, then open http://<IP>:3000 on iPad Safari
hostname -I
```

The dev server binds to all interfaces by default.

## Project layout

```
app/
  page.tsx                    Stock screen
  transaction/[id]/page.tsx   Stock In / Out + Numpad
  history/page.tsx            History by day / shift
  reorder/page.tsx            Reorder list
  reports/page.tsx            Reports + sparkline
  add-product/page.tsx        Add product form
  api/
    products/                 GET, POST, PATCH, DELETE
    transactions/             GET, POST
    reports/                  GET aggregated
components/
  Nav.tsx                     5-tab navigation
  StockBadge.tsx              Color-coded stock badge
  NumPad.tsx                  Large on-screen numpad (kitchen-friendly)
lib/
  client-helpers.ts           classifyStock, getStockBadge (client-safe, no DB import)
  server/                     Server-only code (do not import from client components)
    db.ts                     SQLite singleton
    seed.ts                   5 default products
    reports.ts                Aggregation logic
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

Staff can add any other ingredient via the "+ Add" tab.

## Database

SQLite file at `.data/inventory.db`. Delete it to reset to the 5 default products.

## iPad notes

- Designed for iPad in landscape at 1024×768 or larger
- Touch targets are 80×80px minimum (works through food-prep gloves)
- Font sizes are 18pt+ for legibility
- The numpad is the primary input method — no stylus or handwriting recognition needed
- Browser haptic feedback (`navigator.vibrate`) on successful save
