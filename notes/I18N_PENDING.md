# i18n for data — DEFERRED

**Decision** (2026-06-27): User declined to add Google Translate API now. Demo ships with EN-only product names; UI labels (button text, headers, status) are bilingual via next-intl.

**If user later wants full Chinese data display (Bell Pepper → 灯笼椒, Carrot → 胡萝卜, etc.)**, the canonical approaches are:

1. **Auto-translate on insert** — POST /api/products: take `name` (EN) → call Google Translate API → store both `name` (EN canonical) + `name_zh` (auto). Display locale=en → name, locale=zh → name_zh (fallback name if null). Translates once per product, then cached in DB.
   - Free public endpoint: `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=...` (no key, may rate-limit, unofficial).
   - Google Cloud Translation v2: needs `GOOGLE_TRANSLATE_API_KEY` env, free tier 500K chars/month (~$10 worth of free calls).
   - User must choose which path when implementation resumes.

2. **Two columns at insert time** — `name_en` + `name_zh` columns. User types both. No API, no fallback needed.

3. **Static dictionary** — `messages/zh.json` map en→zh. 1 column `name` (EN), display zh via lookup. Fast, no API, but no new products unless dictionary updated.

**Schema prep if/when implemented**:
- Add `name_zh TEXT` column to `products` table (nullable, indexed if used for search later).
- Migration: `ALTER TABLE products ADD COLUMN name_zh TEXT;`
- Frontend: helper `displayName(product, locale)` that picks the right field with fallback.
- Add/Reorder/History/Reports all switch automatically through the helper.
