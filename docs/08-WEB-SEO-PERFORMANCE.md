# 08 — Website, SEO, CDN and Performance

---

## 1. Information architecture

| Section | URL pattern (keep existing slugs) | Template | Data source |
|---|---|---|---|
| Home | `/` | Home | CMS blocks |
| Board / curriculum | `/cbse-online-tutoring`, `/ib-online-tutoring`, … | `LandingTemplate(type=board)` | CMS `landing_pages` + taxonomy |
| Grade | `/grade-9-online-tutoring` | `LandingTemplate(type=grade)` | same |
| Subject | `/online-maths-tutoring` | `LandingTemplate(type=subject)` | same |
| Exam | `/sat-online-tutoring`, `/cuet-online-tutoring`, `/exam-focused/...` | `LandingTemplate(type=exam)` | same |
| Language / skill | `/spoken-french-online-tutoring`, `/kathak-class-online-tutoring` | `LandingTemplate(type=skill)` | same |
| Country | `/uae-online-tutoring`, `/uk-online-tutoring` | `LandingTemplate(type=market)` + hreflang | same + market prices |
| Combinations (new, programmatic) | `/cbse/grade-9/maths-online-tutoring` | `LandingTemplate(type=combo)` | Generated only when content-quality rules pass (§3.4) |
| Plans & pricing | `/plans-pricing` | Catalogue browser | Catalogue API (ISR) |
| Tutors | `/our-tutors`, `/our-tutors/{slug}` (new) | Directory + profile | Tutors API (ISR) |
| Blog | `/blog`, `/blog/{slug}`, `/blog/category/{slug}` | Article | CMS |
| Resources | `/resource/videos`, `/resources/{type}/{slug}` | Resource | CMS + media |
| Trust | `/about-us`, `/how-tutrain-works`, `/success-stories`, `/faqs`, policies | Static | CMS |
| Conversion | `/book-demo`, `/contact`, `/career` | Forms | API |

Portals move to `app.tutrain.com` and admin to `admin.tutrain.com`. Old `/dashboard/*`, `/login`, `/register` and `/admin/*` paths on www 301 to the new hosts.

All existing URLs in `legacy-redirects.mjs`, `sitemap.js` and the current route folders are exported into a **redirect/URL registry** (CMS collection `redirects`). The registry is enforced at the edge (CloudFront Function for simple 301s) and in Next.js `redirects()` as a backup. CI fails if any URL in the pre-migration crawl returns anything other than 200 or a single 301 hop.

## 2. Rendering strategy

| Page type | Mode | Cache |
|---|---|---|
| Marketing, landing, blog, tutor profiles | **SSG + ISR** (on-demand revalidation via CMS/catalogue webhooks with `revalidateTag`) | CloudFront `s-maxage=86400, stale-while-revalidate=604800`. Purged by tag on publish |
| Plans & pricing (per market) | ISR per market segment (`/plans-pricing?market=AE` → path segment or cookie-free rewrite) | 1 h + on-demand |
| Book-demo / forms | Static shell + client island | Static |
| Portals (`app`), admin | Dynamic, authenticated | `private, no-store` |

React Server Components by default. Client components only for interactive islands (forms, slot picker, carousel, chat widget).

## 3. SEO requirements

### 3.1 Technical SEO
- One `<h1>` per page. Semantic headings. Breadcrumbs on all non-home pages.
- `generateMetadata` on every route: unique title (≤ 60 chars), meta description (≤ 155), canonical (self or chosen canonical), robots, OG/Twitter with a **raster 1200×630 OG image** generated per page via `next/og` (`opengraph-image.tsx`) with brand template.
- `sitemap.xml` index split by type (pages, blog, tutors, resources), generated from the CMS + catalogue, with `lastmod` from content `updated_at`. Submitted to Search Console. `robots.txt` blocks `/api`, `/app`, query-param variants and search pages.
- **hreflang** for market pages: `en-IN`, `en-AE`, `en-GB`, `en-US`, `en-CA`, `en-AU`, `en-NZ`, `en-SG`, `en-ZA`, plus `x-default`. Only where the content truly differs (prices, curriculum, testimonials, FAQs).
- Pagination via `?page=` with self-canonicals. Faceted filters `noindex,follow`.
- 404 with helpful links. 410 for retired content (keep the existing 410 behaviour).
- Trailing-slash policy: none. Lowercase enforced at the edge.
- Internal linking: every landing template renders "related boards/grades/subjects" links from the taxonomy graph, plus contextual blog links.

### 3.2 Structured data (JSON-LD, generated from typed builders in `packages/seo`)

| Page | Schema types |
|---|---|
| Site-wide | `Organization` (+ `EducationalOrganization`), `WebSite` with `SearchAction` |
| Landing pages | `Service` / `Course` (with `provider`, `educationalLevel`, `teaches`, `offers` from live prices, `hasCourseInstance` with `courseMode: online`), `FAQPage` (only visible FAQs), `BreadcrumbList` |
| Tutor profile | `Person` (`knowsAbout`, `alumniOf` where consented) within `ProfilePage` |
| Blog | `Article`/`BlogPosting` (author `Person`, `datePublished`, `dateModified`, image) |
| Videos | `VideoObject` (thumbnail, duration, uploadDate) |
| Reviews | `AggregateRating` only on pages about a specific product/course, following Google's review-snippet guidelines (no self-serving org-level stars) |

Validated in CI with a schema linter, and in the Rich Results Test before release.

### 3.3 Content operations (Payload CMS)
- Collections: `landing_pages` (block-based: hero, USP grid, curriculum outline, tutor strip, pricing teaser, testimonials, FAQ, CTA), `blog_posts`, `authors`, `faqs`, `testimonials`, `redirects`, `assistant_facts`, `media`, `banners`, `navigation`.
- Workflow: Draft → In review → Approved → Scheduled/Published. Version history and live preview.
- SEO panel per document: title/description length meters, focus keyword, canonical override, noindex toggle, OG image preview, internal-link suggestions.
- Publishing calls the revalidate webhook and updates the AI knowledge base.

### 3.4 Programmatic SEO guardrails
Combination pages (board × grade × subject × market) are generated only if they have:
- ≥ 300 words of unique, reviewed copy (curriculum outline from LMS curriculum nodes + specific FAQs),
- ≥ 1 approved tutor for that combination, and
- a real product with a price.

Otherwise they are not generated, and are not in the sitemap. This prevents thin/doorway pages.

### 3.5 Measurement
- Search Console + GA4 (consent-aware). Server-side GTM container on `sgtm.tutrain.com` (first-party). Meta CAPI and Google Ads enhanced conversions sent server-side from CRM events (`lead.created`, `demo.booked`, `order.paid`), with consent.
- Monthly SEO report: indexed pages, CWV pass rate, top queries, landing-page conversion.

## 4. Performance budget and techniques

| Budget (mobile, p75 field) | Target |
|---|---|
| LCP | ≤ 2.0 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.05 |
| JS per landing route (gz) | ≤ 150 KB (chat widget deferred, ≤ 40 KB) |
| CSS (gz) | ≤ 35 KB |
| Hero image | ≤ 120 KB AVIF, `priority`, explicit dimensions |
| Fonts | 1 variable font family (+ optional 1 display), `woff2`, subset, `display: swap`, preloaded only on the critical weight |

Techniques:
- Remove from the public bundle: `three`, `react-globe.gl`, `swiper` (use CSS scroll-snap), FullCalendar, TinyMCE, `react-countup`, and heavy `framer-motion` usage (use CSS transitions / `motion` mini only where needed). Portal/admin-only libraries live only in `apps/app` and `apps/admin`.
- `next/image` with a **CloudFront image-optimisation origin** (or the Next image optimiser on ECS behind CloudFront with long cache). AVIF/WebP, responsive `sizes`.
- Third-party scripts (GA, Pixel, chat) via Partytown or `afterInteractive`/`lazyOnload` with consent gating. No tags fire before consent where consent is required.
- Preconnect only to the API and the media CDN.
- `<link rel="preload">` LCP image. Avoid client-side data fetching above the fold.
- Lighthouse CI budgets in PRs (top 20 templates). RUM via `web-vitals` → analytics, with an alert when the field p75 regresses.

## 5. CDN and edge configuration (CloudFront)

| Behaviour | Path | Origin | Cache policy |
|---|---|---|---|
| Static build assets | `/_next/static/*` | S3 (uploaded at build) | 1 year, immutable |
| Public media | `media.tutrain.com/*` | S3 (CMS media) | 30 days + versioned filenames |
| Optimised images | `/_next/image*` or `img.tutrain.com` | Image optimiser | 30 days, keyed on url/w/q/accept |
| HTML (www) | `/*` | ALB → web | Honour `s-maxage`. Cache key excludes cookies except the consent/market cookie if used. Strip marketing query params (`utm_*`, `gclid`, `fbclid`) from the cache key |
| API | `api.tutrain.com/*` | ALB → api | No cache (except explicitly public GETs such as `/v1/public/catalog`, 5 min) |
| Recordings | `media.tutrain.com/hls/*` | S3 private (OAC) | Signed cookies required. 1 day |
| Admin | `admin.tutrain.com/*` | ALB → admin | No cache. WAF: rate rules, optional IP allowlist |

Edge functions: lowercase + trailing-slash normalisation, the 301 registry for simple rules, security headers (HSTS preload, CSP with nonces, `Permissions-Policy`), and country header → market suggestion banner (never auto-redirect search bots).

Security headers (tightened from today):
- CSP with per-request **nonces** for scripts (drop `'unsafe-eval'`, `'unsafe-inline'` scripts). An explicit allowlist of analytics domains.
- `frame-ancestors 'none'` (admin) / `'self'` (www).
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- Remove dev hosts (`devtunnels`, LAN IPs) from production `images.remotePatterns`.

## 6. Accessibility and UX
- WCAG 2.2 AA. Colour tokens from `design.md` checked for contrast (orange-on-cream text needs verification; use `--text` for body copy).
- Forms: labels, inline validation, phone input with country code (keep `CountryCodeSelector`), OTP autofill (`autocomplete="one-time-code"`), WhatsApp OTP first.
- Sticky "Book free demo" CTA on mobile. Chat entry point that doesn't cover the content.

## 7. Analytics event taxonomy (excerpt)

| Event | Properties |
|---|---|
| `page_viewed` | page_type, board, grade, subject, market |
| `cta_clicked` | cta_id, location |
| `demo_form_started` / `demo_form_submitted` | source(form/chatbot/whatsapp) |
| `chat_opened` / `chat_message_sent` / `chat_lead_captured` / `chat_demo_booked` / `chat_handoff` | conversation_id, turn |
| `checkout_started` / `payment_succeeded` | product_id, market, amount_minor (server-side only) |
| `portal_join_clicked` | session_id (pseudonymous) |

Events are defined in `packages/contracts/analytics.ts` and type-checked at call sites.
