# Completed Tasks: 2026-10-03 session

_Branch: `modification` (base `d7cc09e`) · **All changes are staged, not committed** (see DECISIONS.md D10)_

## 1. Analysis

| Task | Result |
|---|---|
| Mapped the Nestar monorepo structure | 2 apps, 8 components, 9 schemas, batch cron, socket chat |
| Listed every `nestar` occurrence | 13 files (config, tsconfig, imports, strings, e2e spec) |
| Listed Property/Agent couplings outside the property module | like, view, comment, member, notification schema, batch |
| Found inherited bugs | REST 500 from `LoggingInterceptor`; admin `propertyLocationList` filter; stray `console.log` |
| Confirmed decisions with the owner | app rename, D7 field proposal, fresh DB; narrowed scope to "safe rename layer" |

## 2. Layer 1: safe rename (no business logic change)

| Area | Change | Files |
|---|---|---|
| App folders | `git mv` → `apps/la-memoria-api`, `apps/la-memoria-batch` (86 files, all detected as pure renames) | `apps/**` |
| Nest CLI | `sourceRoot`, `root`, `tsConfigPath`, project keys | `nest-cli.json` |
| npm | `name: la-memoria`; scripts `build:batch`, `start:dev:batch`, `start:prod`, `start:prod:batch`, `test:e2e` | `package.json`, `package-lock.json` |
| Build output | `outDir` → `dist/apps/la-memoria-*` | `apps/*/tsconfig.app.json` |
| Absolute imports | `apps/nestar-api/src` → `apps/la-memoria-api/src` | `auth.guard.ts`, `roles.guard.ts`, `batch.module.ts`, `batch.service.ts` |
| Labels | welcome strings; DB connection log labels | `app.service.ts`, `batch.service.ts`, both `database.module.ts` |
| Test fix | `NestarBatchModule` (did not exist) → `BatchModule`; describe label | `apps/la-memoria-batch/test/app.e2e-spec.ts` |
| Docs | Nest starter README → La Memoria README | `README.md` |
| Tooling | added `eslint@^9`, `typescript-eslint`, `@eslint/js@^9`, `globals`; removed `@typescript-eslint/{eslint-plugin,parser}` v6 | `package.json`, `package-lock.json` |
| Documentation | this `docs/` folder | `docs/*.md` |

Diff size: 90 files, 489 insertions and 690 deletions. Most of the deletions are the README and the lockfile.

**Not changed (by design):** GraphQL operations and types, Mongo collections, model tokens, enums, batch job constants, `.env` keys, business logic.

## 3. Validation status

| Check | Command | Result |
|---|---|---|
| No "nestar" left | `git grep -n -i nestar` | ✅ 0 matches |
| Typecheck: API | `npx tsc --noEmit -p apps/la-memoria-api/tsconfig.app.json` | ✅ exit 0 (baseline also 0) |
| Typecheck: batch | `npx tsc --noEmit -p apps/la-memoria-batch/tsconfig.app.json` | ✅ exit 0 |
| Build: API | `npm run build` | ✅ → `dist/apps/la-memoria-api` |
| Build: batch | `npm run build:batch` | ✅ webpack compiled → `dist/apps/la-memoria-batch` |
| Lint: whole repo | `npx eslint "apps/**/*.ts"` | ⚠️ 355 existing findings (329 errors, 26 warnings); before this session lint could not run at all |
| Lint: changed lines only | per-line filter over the staged diff | ✅ 0 new findings |
| Runtime: API | `node dist/apps/la-memoria-api/main` | ✅ Mongo connected; GraphQL schema unchanged (`getProperties`, `getAgents`, `getMember` present) |
| Runtime: API REST | `GET /` | ❌ 500, a pre-existing `LoggingInterceptor` bug (D9) |
| Runtime: batch | `node dist/apps/la-memoria-batch/main`, `GET /` | ✅ "Welcome to La Memoria BATCH API server!" |
| Unit / e2e tests | `npm test`, `npm run test:e2e` | ⏭️ not run (no unit specs exist; e2e needs a DB) |

Top lint findings by rule: `prettier/prettier` 90, `no-unsafe-member-access` 66, `no-unsafe-assignment` 49, `no-unused-vars` 39, `no-unsafe-call` 28, `no-unsafe-argument` 24, `no-unsafe-return` 19, `ban-ts-comment` 13.

## 4. Process notes
- The target folders `apps/la-memoria-*` already existed as **empty directory skeletons**, so the first `git mv` nested the apps. I deleted the empty directories (after confirming they held no files) and moved the apps up a level.
- I ran an unnecessary `git stash` / `stash apply`. The tree was checked against the stash before dropping it, and nothing was lost.
- I made an unrequested commit (`336d422`), then reverted it with `git reset --soft HEAD~1`. The changes remain staged.

---

# Completed Tasks: 2026-10-04 session

_Branch: `modification` · L1 was already committed (`4d9677c`). **This session's work is staged / in the working tree and not committed** (D10)._

## 1. Layer 2 + 3: Property → Package (ER field set)

| Area | Change |
|---|---|
| Enums | `property.enum.ts` → `package.enum.ts`: `PackageType` PEARL/GOLD/DIAMOND, `PackageStatus` HOLD/ACTIVE/PAUSE/DELETE, `PackageStyle` (new), `PackageLocation`. `*Group.PROPERTY` → `.PACKAGE` (comment, like, view, notification) |
| Schema | `Property.model.ts` → `Package.model.ts`, collection `packages`, ER fields (`packageDuration`, `packagePhotos`, `packageReservations`, `packageAlbum/Dress/Makeup`, `pausedAt`); real-estate fields removed |
| DTOs | `dto/property/*` → `dto/package/*`: `Package(s)`, `PackageInput`, `PackageUpdate`, `PackagesInquiry` (adds `styleList`, `photosList`, `durationsRange`), `StudioPackagesInquiry`, `AllPackagesInquiry` |
| Component | `components/property` → `components/package`: every operation renamed (see BACKEND_MIGRATION.md §6) |
| Shared | like/view: `getFavoritePackages`/`getVisitedPackages` with `from: 'packages'`; comment injects `PackageService`; `memberProperties` → `memberPackages`; notification uses `notificationRefId` |
| Config | `availablePackageSorts`, `availableOptions` (album/dress/makeup), `favoritePackage`/`visitedPackage` aliases |
| Bug fixes | admin location filter (`packageLocation`), stray `console.log`, `pausedAt`/`deletedAt` now saved, PAUSE/HOLD can be reactivated (D12) |

## 2. AGENT → STUDIO
`MemberType { USER, STUDIO, ADMIN }`; `getAgents` → `getStudios`, `AgentsInquiry` → `StudiosInquiry`, `availableStudioSorts`. Batch: `'Package'` model, `BATCH_TOP_PACKAGES`/`BATCH_TOP_STUDIOS`, `batchTopPackages`/`batchTopStudios`.

## 3. Layer 4: Reservations module
New `ReservationModule` (see BACKEND_MIGRATION.md §9).

## 4. Validation

| Check | Result |
|---|---|
| `npx tsc --noEmit` (API and batch) | ✅ exit 0 |
| `npm run build`, `npm run build:batch` | ✅ |
| `npx jest` (new `package.service.spec.ts`, `reservation.service.spec.ts`) | ✅ 14/14 |
| `git grep -i -E "propert\|agent" -- apps` | ✅ 0 matches |
| API boot plus GraphQL introspection | ✅ the new operations and enum values are present |
| Lint on touched files | ⚠️ the existing Nestar patterns remain (`no-unsafe-*`, `(returns) =>`, `err.message`); no new rule categories |
| Playground write smoke flow | ⏭️ not run: it would write to the Atlas `La-Memoria` DB without the owner's approval |

---

# Completed Tasks: 2026-10-05 session (frontend)

_Repo: `la-memoria-next` · Branch: `modification` · **Changes are in the working tree / staged moves, not committed** (D10)_

Before this session, the backend L2–L4 had been committed (`b23425b`), and the frontend still targeted the Nestar schema, so every package/agent/member page failed at runtime.

## 1. Phases (per FRONTEND_MIGRATION.md)

| Phase | Change |
|---|---|
| 0 Baseline | `yarn tsc --noEmit` ✅, `yarn build` ✅ before any edit |
| 1 Brand | `package.json` → `la-memoria-next`; titles/meta in 3 layouts; Footer; `_document` SEO (en/ru/kr); join/community labels; `NESTAR … MOBILE` placeholders |
| 2 Contract | `libs/enums/package.enum.ts` (PEARL/GOLD/DIAMOND, HOLD/ACTIVE/PAUSE/DELETE, PackageStyle, PackageLocation), `reservation.enum.ts`; `libs/types/package/*`, `libs/types/reservation/*`; `MemberType.STUDIO`; `*Group.PACKAGE`; `memberPackages`; `StudiosInquiry`; config `availableOptions` (album/dress/makeup), `packageDurations`, `packagePhotosList`, `topPackageRank`. Old `property` enum/types deleted |
| 3 Renames | `git mv`: `pages/property→package`, `pages/agent→studio`, `_admin/properties→packages`, `components/property→package`, `agent→studio`, `AgentCard→StudioCard`, `PropertyBigCard→PackageBigCard`, homepage `*Properties/*Agents→*Packages/*Studios`, mypage/member/admin package components, matching SCSS files and imports. Token rename Property→Package / Agent→Studio across TS/TSX/SCSS (asset paths and `userAgent` protected); identifier `property` → `pkg` via TS AST (`package` is a reserved word) |
| 4 GraphQL + consumers | All operations/args per BACKEND_MIGRATION §6; selection sets use ER fields (`packageDuration/Photos/Style/Album/Dress/Makeup/Reservations`, `pausedAt`). Cards/detail show photos, style, duration (h), Album/Dress/Makeup. `Filter`/`HeaderFilter`: style, edited photos, duration range, album/dress/makeup; year-built filter removed. `AddNewPackage` form: style, duration, photos, album/dress/makeup; upload `target: 'package'`. Status lifecycle (D12): studio tabs Active/Paused/On Hold + status menu; admin tabs Hold/Paused + menu for any non-DELETE |
| 5 Terminology | `public/locales/{en,kr,ru}` rewritten for new keys; FAQ package/couples/studios content rewritten; About, Footer, MyMenu ("Saved Packages", "Recently Viewed"), join role "Couple" |
| 6 Reservations | gql `CREATE_RESERVATION`, `UPDATE_RESERVATION`, `GET_MY_RESERVATIONS`, `GET_STUDIO_RESERVATIONS`, `GET_ALL_RESERVATIONS_BY_ADMIN`; package detail: the placeholder contact form is replaced by a working reservation form (date, note); `mypage?category=myReservations` (couple: cancel · studio: confirm/complete/cancel); `/_admin/reservations` read-only list with status tabs |

## 2. Validation

| Check | Result |
|---|---|
| `yarn tsc --noEmit` | ✅ 0 errors |
| `yarn build` | ✅ all 22 routes, including `/package`, `/studio`, `/_admin/packages`, `/_admin/reservations` |
| All 41 gql documents validated against the live `:3007` schema (introspection) | ✅ 0 invalid |
| Read-only runtime queries with the pages' real default inputs (filters, sorts, studios) | ✅ accepted by the backend validators |
| `next start` + every route | ✅ 200; `/property`, `/agent` → 404; `/kr`, `/ru` locales render |
| Leftover terms `propert|agent|nestar|barter|…` in `apollo libs pages scss` | ✅ only the two banner asset filenames (`properties.png`, `agents.webp`) |
| Write flows (create package, reserve, confirm) in the browser | ⏭️ not run: they write to the Atlas DB, so they need the owner's go-ahead |

## 3. Notes / known gaps
- Asset placeholders: homepage type tiles reuse `apartment/villa/house.webp` for PEARL/GOLD/DIAMOND, and the banners still use `properties.png` / `agents.webp`. Replace them with wedding artwork.
- Detail page amenity icons still use `bed.svg`/`room.svg`/`expand.svg` for photos/style/duration.
- Some CSS class names were renamed together with the SCSS (`package-*`, `studio-*`), and they stay consistent with each other.
- Pre-existing, untouched: mobile views are placeholders; the unused stub `getPackagesRefetch` at the end of `pages/studio/detail.tsx`.

## 2026-10-05 (frontend): La Memoria logo
- Replaced the Nestar artwork in `la-memoria-next/public/img/logo/` while keeping the same filenames, so no `<img src>` changed:
  - `logoWhite.svg`: coral emblem + "La Memoria" serif wordmark + "WEDDING STUDIOS" tagline, 150×52, white text for the dark header and footer
  - `logoText.svg`: emblem only, 40×40, for the join, community and admin pages
  - `favicon.svg`: emblem only
- The emblem is a coral `#EB6753` disc with two interlocking white wedding rings and a diamond.
- Code touch-ups: `alt="La Memoria"` in `Top.tsx` and `Footer.tsx`; the favicon `<link>` type is now `image/svg+xml`.
- Checks: `yarn tsc --noEmit` ✅, `yarn build` ✅, the logo assets return 200 (`image/svg+xml`), and rendered previews were checked on dark and light backgrounds.
- Note: the wordmark is SVG `<text>`, so it renders in the system serif (Didot/Georgia). Converting it to outlines would make it pixel-identical across operating systems.

## 2026-10-05 (frontend): logo hover animation
- New `libs/components/common/AnimatedLogo.tsx` renders the logo SVG inline (CSS can't reach inside an `<img>` SVG). It replaces the `<img>` in `Top.tsx` (header) and `Footer.tsx` (both branches).
- New `scss/components/animatedLogo.scss`, imported in `scss/app.scss`. On hover, and on keyboard `:focus-visible` of the link (~1.1s, pure CSS):
  - the disc scales up with a coral glow
  - the rings "clink" apart and back
  - the inner orbit ring redraws
  - the diamond grows, spins and sparkles
  - a coral underline draws under the wordmark, and the tagline letter-spacing widens
- `prefers-reduced-motion` keeps only the glow and underline.
- `scss/pc/main.scss` `.logo-box` sizes the inline svg (150px), matching the old `img` rule.
- Checks: `yarn tsc --noEmit` ✅, `yarn build` ✅, and the server-rendered header and footer contain `.lm-logo`. Frozen-frame renders of the animation were reviewed.

## 2026-10-05 (frontend): logo hover animation refined (premium, no background effect)
- Removed every background-type effect: the disc scale and coral `drop-shadow` glow, the orbit redraw, and the tap highlight (`-webkit-tap-highlight-color: transparent`).
- Removed the playful motion: the bouncy easing, the ring clink, the 360° diamond spin and the sparkle burst.
- New motion, using one ease-out-quint curve (`cubic-bezier(0.22, 1, 0.36, 1)`) and slow 0.8–1.4s timing with no overshoot:
  - the rings "embrace" (drift 0.6px together, tilt ±4°, held while hovering)
  - the diamond lifts 0.6px, with a single soft 4-point glint
  - a blush (`#F3C9BF`) light sheen glides through "La Memoria", clipped to the letters
  - a 0.6px blush hairline underline grows from the center
  - the tagline letter-spacing breathes from 2.35 to 2.6px
- `AnimatedLogo.tsx` uses `useId()` for unique clip and gradient ids, so the header and footer instances don't clash.
- Reduced motion: only the underline and tagline opacity fade in.
- Checks: `yarn tsc --noEmit` ✅, `yarn build` ✅. A pixel diff of rest vs. hover frames shows the disc and background unchanged, and only the rings, diamond, wordmark sheen, underline and tagline move.

## 2026-10-05 (frontend): homepage 3D gallery photos
- Replaced the 8 Nestar real-estate photos used by `FiberContainer.tsx` (`.threeJSContainer`) with free [Unsplash](https://unsplash.com/license) Korean-style modern wedding and pre-wedding photos:
  - studio shots: cherry-blossom wall, veil with beige suit, floral arch
  - a modern hanbok-style gown at a palace wall
  - garden, hillside at golden hour, Seoul cityscape and lakeside sunset
- Same filenames (`public/img/fiber/img1–8.jpg`), so there is no code change.
- Resized to a 1600px long side and optimized (5.6 MB → 2.1 MB in total; the largest was 2.4 MB at 8192px).
- Attribution is in `public/img/fiber/CREDITS.md`.
- Checks: candidates were reviewed visually (non-wedding hanbok tourist photos rejected), the carousel cover-crop was simulated so the subjects stay in frame, `yarn build` ✅, all 8 assets are served with 200.

## 2026-10-05 (frontend): homepage gallery recollected (MZ-style studio snaps, no repeats)
- The user asked for the modern `#웨딩촬영` look. Instagram posts are copyrighted by their owners, so the photos came from [Pexels](https://www.pexels.com/license/) (free commercial use) in the same minimal studio-snap style:
  - white and black backdrops, calla lilies, a bold red set, playful and dancing poses
  - a veil in motion
  - a rainy traditional-house snap
- **15 unique photos** (`public/img/fiber/img1–15.jpg`, 1.9 MB total), replacing the previous 8.
- `FiberContainer.tsx`:
  - `galleryPages` now builds 5 screens × 3 unique images, so each image appears once per cycle (before, img4 appeared twice and pages 4–5 repeated pages 1–2)
  - a 6th screen mirrors screen 1 only so the infinite scroll wraps seamlessly
  - `pages` = `galleryPages.length + 1`
- Credits are in `public/img/fiber/CREDITS.md`.
- Checks: `yarn tsc --noEmit` ✅, `yarn build` ✅, 15/15 images served, no duplicate files (md5), and the cover-crop was simulated to keep the couples in frame.

## 2026-10-06 (frontend): homepage rebuilt to the Stitch design
- **Reference:** the Stitch MCP screen "La Memoria — Minimal Luxury Editorial Homepage" (project "La Memoria Wedding Studios"). There is no screen named exactly "La Memoria — Homepage".
- **Shared header and footer restyled (user decision):**
  - `Top.tsx`: ivory frosted bar, centred dark-tone `AnimatedLogo`, saved-count badge from `GET_FAVORITES`, mobile/tablet drawer. Auth, language and user-info logic kept.
  - `Footer.tsx`: link columns that point to real routes and filters.
  - `AnimatedLogo` gained a `tone` prop.
- **Hero:** new `HomeHero` (photo hero) replaces the `FiberContainer` 3D gallery in `LayoutHome`. `HeaderFilter` was restyled as the 01/02/03 search bar with its logic unchanged, plus an "All" option. Property-era type images were removed.
- **Sections** (shared `HomeSection` / `FilterTabs` / `EmptyState`):
  - Trending: location tabs, featured card plus 4 numbered cards
  - Our philosophy: `HomeStory`, static
  - Most Popular: style tabs, Swiper
  - Choose Your Tier: `PackageTiers`, real "From ₩" and package counts
  - The Studios
  - From the Community
  - Every data section has MUI skeletons and an empty state.
- **Hidden from the homepage (components kept):** Advertisement, TopPackages, Events (the events were hard-coded samples).
- **Tokens:** `variables.scss` gained the Stitch colours (darker muted text for AA contrast), EB Garamond and DM Sans, the type scale, spacing and breakpoint mixins. Existing variables are unchanged.
- **New styles:** `scss/components/siteHeader.scss` and `siteFooter.scss`, `scss/home/hero.scss` and `sections.scss`. Old navbar, footer, hero and section rules were removed.
- **Helpers:** `formatKRW`, `prettyEnum`, `packageSearchHref` in `libs/utils.ts`.
- **Other:** "Help" locale key; `.eslintrc.json` (`next/core-web-vitals`); lint error fixed in `pages/about/index.tsx`; images saved to `public/img/home/` (hero and story, from the Stitch project).
- **Checks:**
  - tsc ✅, lint ✅ (0 errors, warnings only in untouched pages), build ✅. Home JS went from 208 kB to 12.8 kB (first load 528 → 369 kB).
  - Live API: every new query input accepted.
  - Dev-server screenshots at 1440 / 1024 / 390 (device emulation): no horizontal overflow, smallest HTML text 11px, no images without alt.
- **Known:** production builds have no API URL, because the `REACT_APP_*` values exist only in `.env.development`; this was already the case before this task. Skipped design items (ratings, events, newsletter, invented names, decorative codes) are listed in the session report.

## 2026-10-06 (frontend): SCSS restructured to the project's own conventions
- **Standard (inferred from the existing files; none was written down):**
  - files live in `scss/pc/<page>/` (imported from `scss/pc/main.scss`) and `scss/mobile/main.scss`
  - rules nest under `#pc-wrap` / `#mobile-wrap`, mirroring the JSX
  - plain kebab-case class names (no BEM, no prefixes), tab indentation (2 spaces in `mobile/main.scss`, as that file already is), `/** **/` comments
  - no breakpoint media queries; desktop and phone are separate trees
- **Done:**
  - Removed `scss/components/` and `scss/home/` and their `app.scss` imports. Deleted the dead `packageCard.scss`.
  - Renamed every `lm-`/BEM class and id in 17 components to kebab-case, e.g. `lm-header__nav` → `router-box`, `lm-trend-card__title` → `card-title`.
  - **Layout:** desktop in `pc/main.scss` (`#top`, `#footer`) and `pc/homepage/homepage.scss` (`.home-hero`, `.home-page` sections); phone in `mobile/main.scss`.
  - **Shared looks:** logo animation, MUI menu and drawer, card typography; these live in `pc/general.scss`, scoped under unique roots (`.navbar`, `.home-hero`, `.home-page`, `.footer-container`, `.animated-logo`).
  - `variables.scss`: plain names (`$ivory`, `$mocha`, `$espresso`…); mixins `eyebrow`, `text-link`, `focus-ring`. The media-query mixins were removed.
- **Kept:** one `@media (prefers-reduced-motion: reduce)` block (accessibility, not a breakpoint).
- **User decision (strict split, no breakpoint queries):** a desktop browser at about 1024px now scrolls horizontally, because of the 1300px container (page width 1300 at 1024).
- **Checks:**
  - tsc ✅, lint ✅, build ✅
  - visual re-check on the dev server at 1440 and 390, matching the pre-refactor renders
  - two fixes found and applied: Swiper inside the flex `.container` needed `min-width: 0`; locked carousel arrows are hidden again
  - smallest HTML text 11px, no images without alt

## 2026-10-07 (frontend): brand logo switched to the "LM" monogram
- **Source:** `la-memoria-monogram.svg` from the Stitch project, saved byte-for-byte as `public/img/logo/monogram.svg`, with its C2PA metadata intact.
- **`AnimatedLogo.tsx`** (header, footer, menu drawer): the monogram replaces the coral ring emblem. It is drawn through a CSS mask, so it takes the tone colour (mocha on ivory, white on dark). The wordmark sits beside it, and the 150×52 size API is unchanged.
- **Hover:** the monogram lifts 1px with a gentle 4% scale; the wordmark sheen, underline and tagline animation are kept. The old ring, diamond and glint rules and keyframes were removed from `scss/pc/general.scss`, and reduced motion is respected.
- **Static files** (derived copies, provenance metadata stripped because they are recoloured):
  - `logoText.svg`: mocha monogram, used on the join, community and admin pages
  - `favicon.svg`: mocha monogram on an ivory disc, so it stays visible on dark tabs
  - `logoWhite.svg`: white monogram plus wordmark
- **Checks:** tsc ✅, lint ✅, build ✅, the four logo assets are served (200), and renders were checked in the desktop header and footer and the phone header.

## 2026-10-07 (frontend): homepage refinement + shared button system
- **`CLAUDE.md` (new):** SCSS conventions, covering structure and imports, the desktop/phone split, variables and mixins, naming, the container and button system, and a checklist for adding styles to a new component.
- **Shared buttons** (`scss/variables.scss` tokens `$btn-*` and the `button-base`/`button-primary`/`button-secondary` mixins, with `text-link` rewritten; classes `.button-primary`, `.button-secondary` and `.button-link` in `pc/general.scss`):
  - primary is solid espresso with an uppercase 0.18em label and a CSS arrow that slides right on hover
  - secondary is an outline that fills on hover
  - the text link's underline draws in from the left
  - all three have focus-visible, pressed and disabled states, and reduced motion is respected
- **Homepage:** every CTA uses the shared buttons (the old `.primary-btn`, `.view-link` and `.hero-link` styles are removed). Removed the small labels above section titles, the "01 /" search numbering, the tier codes and badge, the divider lines and the zero counts. With one item, the trending, popular and community cards switch to a wide two-column layout (no empty gaps). A post without an image shows its category name in the placeholder.
- **Layout:** the `page-container` mixin (1440px max, `clamp(48px, 6.67vw, 96px)` side padding; 24px on phones) is applied to the hero, every homepage section, and the shared header and footer containers. `$section-space` is 112px desktop and 72px phone. The 276px sideways scroll at 1024px is gone.
- **Checks:** tsc ✅, lint 0 errors ✅, build ✅. Screenshots at 1440 / 1024 / 390 with no overflow, every section aligned to the container, smallest text 11px, no images without alt.

## 2026-10-07 (frontend): site fonts switched to the Stitch "Editorial Archive" typography
- **Fonts:** Chivo for headings (400/500), DM Sans for body, UI, labels and buttons (one variable file), and self-hosted Pretendard at the end of both stacks for Korean (downloaded only when a page shows Hangul). The logo wordmark keeps EB Garamond italic. All are loaded with `next/font` (`libs/fonts.ts`, `display: swap`) and exposed as CSS variables in `pages/_app.tsx`; the MUI theme uses the same body font.
- **Removed:** the Google Fonts `@import`s (Poppins with 18 styles, DM Sans and EB Garamond) from `scss/variables.scss`, the `$font-sans` / `$font-serif` variables, and the hard-coded Playfair/Poppins (logo), Nunito (chat) and 'Poppins' (`pc/main.scss`) fonts.
- **SCSS:**
  - `$font` is now DM Sans; it is used by all older pages, which switched from Poppins with no per-file edits.
  - `$font-heading` (new) is Chivo.
  - The Stitch type scale is added as mixins, from `text-display-hero` to `text-label-meta` (label-meta raised from 10px to 11px).
  - `eyebrow` follows `text-label-uppercase`, and the button label is 11px.
- **Size changes:**
  - the homepage hero is 72px / 44px on phones (was 64–96px / 48px)
  - section titles use headline-lg 48/56 (32/40 on phones)
  - the page banner titles on Packages, Studios, Community and Help moved from DM Sans 600 to Chivo headline-lg
  - the article placeholder lost its italic
- **Checks:** Home, Packages, Studios, Community and Help at 1440 and 390 in EN and KO with no overflow, no clipped headings and no wrapping buttons; Pretendard loads only on KO pages. My Page redirects without a login, so it was not checked. tsc ✅, lint 0 errors ✅, build: see the report.

## 2026-10-07 (frontend): homepage layout fixes, 1300px container, new philosophy section
- **Overflow:** the Most Popular swiper was forced to `overflow: visible !important`, which made the page 3495px wide. It is clipped again, and `#pc-wrap` / `#mobile-wrap` get `overflow-x: clip` as a safety net.
- **Titles:** the global `a { white-space: nowrap }` stopped card titles from wrapping. Card and feature titles now wrap and clamp to 2 lines, and cards get `min-width: 0`.
- **Sections:** scroll reveals no longer render at opacity 0 on the server (`useReveal` in `common/motion.ts`). Content is visible by default and only below-the-fold sections fade in, using IntersectionObserver, never under reduced motion.
- **Chat:** the wrapper is fixed and out of the page flow, and the closed panel is hidden in place instead of parked off-screen.
- **Container:** `page-container` content is now exactly `$container-width` (1300px, the same as `#pc-wrap .container`), with a `$container-gutter` of at least 48px on narrower screens.
- **"Our philosophy":** an editorial layout: a full-width statement, then the photo, the copy, three numbered points and a link.

## 2026-10-07 (frontend): removed unused code, assets and packages
- **Files (18):** the old 3D gallery (`FiberContainer`, `ScrollControls`), `Advertisement`, `Events`, `TopPackages`/`TopPackageCard`, `cs/Inquiry`, `mypage/Article`, the like/notice/notification/view enums, the like/view types, `reservation.update.ts` and the empty `scss/mobile/general.scss`.
- **public/ (~47 MB):** `video/ads.mov`, `img/event.svg`, `banner/header3.svg`, the cities/types banners, the events, fiber, property and flag images, 13 unused icons, `logoWhite.svg`, `next.svg`/`vercel.svg` and `.DS_Store`. The old `img/home/hero.jpg` was moved to the Trash.
- **Code:**
  - dead exports (`glassPress`, `availableOptions`, 4 sweet alerts, the `BoardArticles`/`Members`/`AdminMemberUpdate` types) and the `"Register"` locale key
  - commented-out code
  - every unused import, variable and helper reported by `tsc --noUnusedLocals` (now 0)
  - query and mutation calls were kept, and only their unused return values were dropped
- **SCSS:** removed 107 class selectors that no component renders (~1,450 lines). The removal was parser-based and compile-checked. `completed` stays because it is built at runtime from the reservation status.
- **Packages (43 removed with `yarn remove`):** three/@react-three, react-scripts, styled-components, slick, react-spring, chart.js, notistack, the date pickers, the toast-ui plugins and others. `subscriptions-transport-ws` stays because Apollo's WebSocket link needs it.
- **Kept on purpose:** the unused Apollo definitions (`UPDATE_BOARD_ARTICLE`, `REMOVE_COMMENT_BY_ADMIN`, `themeVar`) per AGENTS.md, plus `favicon.ico`, `next-env.d.ts` and the peer packages (`@emotion/*`, `graphql`, `i18next`, `react-i18next`, `sass`).
- **Checks:** tsc ✅, `tsc --noUnusedLocals` 0 ✅, lint 0 errors ✅, production build ✅ (77 pages), and the built homepage at 1440 / 1024 / 390 has no console errors and no overflow.

## 2026-10-07 (frontend): Packages page (/package) redesign
- **Layout:** the page uses `withLayoutFull` (shared header and footer, no banner photo). Content uses the 1300px `page-container`.
- **Header and filter:** a "PACKAGES" label, the "Find your package" headline, one muted line, and the sentence filter: "I'm looking for [All tiers] packages in [All locations] with [any style]."
  - Each value is a dropdown from the backend enums: an MUI Menu on desktop, a bottom-sheet Drawer on phones.
  - Beside it: search by package name (the backend searches `packageTitle` only) and a "More filters" button with an active count.
- **More filters panel** (right side; full screen on phones):
  - edited photos as chips (exact counts)
  - Album, Dress and Makeup
  - duration and price (₩) range sliders, applied when released
  - footer: "Reset" and "Show N packages"
- **Results:**
  - toolbar with the count, removable chips plus "Clear all", and sort (Newest, Price low to high, Price high to low, Most liked, Most viewed)
  - a slim sticky bar under the navbar once the sentence scrolls away
  - the homepage `PopularPackageCard` (with a new optional like button that only /package turns on) in an auto-fill grid: 3, 2 or 1 columns
  - card-shaped skeletons, a sentence empty state ("No Gold packages in Daegu yet." with "Show all tiers" / "Clear filters"), and pagination with "Showing 1–9 of 12"
- **Logic:** same `GET_PACKAGES` query, `?input=<JSON>` URL and like mutation. New: sort is now saved in the URL, "Newest" sorts `createdAt DESC` (was ASC), any filter change returns to page 1, and the query waits for `router.isReady` (no double fetch). Helpers are in `libs/components/package/packageSearch.ts`. The old `Filter.tsx` was removed; `PackageCard.tsx` stays for My Page.
- **SCSS:** looks in `pc/general.scss`; the homepage card, tag, chip, skeleton and empty styles are shared through `.package-page`. Layout is in `pc/package/package.scss` and `mobile/main.scss`, with new tokens `$nav-height`, `$sentence-size`, `$panel-width` and `$sticky-bar-height`.
- **Checks:** 31 browser checks pass, covering each dropdown (mouse and keyboard), the panel (focus trap, Esc, focus return), chips, sort order, Clear all, pagination, pasted URLs, the empty state, the sticky bar and the phone sheets. There is no overflow at 1440 / 1024 / 390, the smallest text is 11px, and there are no console errors. tsc ✅, lint 0 errors ✅, build ✅.
- **Update (same day): Packages header made type-led.** There is no box or band now. A "PACKAGES" label sits on a hairline, and the sentence itself is the headline: 64px (34px on phones), espresso text with the chosen values in mocha. Search and More filters sit on a rule below. "Find your package" stays as a hidden h1 for screen readers. The dark-card tokens were removed. 31 browser checks ✅, lint 0 errors ✅, build ✅.

## 2026-10-07 (frontend): Studios page (/studio) redesign
- **Layout:** `withLayoutFull` (no banner) and the 1300px container. The header has the "STUDIOS" label on a hairline, "Meet the studios", one muted line, and the studio count on the right.
- **Toolbar:** search as you type (the backend matches `memberNick`) and a shared sort menu with Newest, Most liked, Most viewed and Top ranked (only `availableStudioSorts`; most packages and most followers would need a backend change). Search, sort and page are saved in `?input=`, and search and sort return to page 1.
- **Editorial rows** (`libs/components/studio/StudioRow.tsx`):
  - an arch-topped black-and-white portrait that turns to colour on row hover, or the initial on sand
  - the name (`memberFullName` or the capitalized `memberNick`), "DISTRICT · CITY" read from `memberAddress`, a one-line `memberDesc`, and package and follower counts above 0
  - up to 3 package photos (one cached `GET_PACKAGES` request per row with `memberId` and `limit 3`, skipped when the studio has 0 packages), "View studio →", and an outlined heart (`LIKE_TARGET_MEMBER`)
  - the name link is stretched over the whole row, and the photos and heart sit above it
  - on phones the row stacks and the photos scroll sideways
- **States:** skeleton rows, "No studios match …" with "Clear search", and shared pagination with "Showing 1–6 of 6 studios".
- **Shared code and cleanup:**
  - `SortMenu` and `ResultsPagination` moved to `libs/components/common/ListControls.tsx`, which the Packages page uses too
  - `GET_STUDIOS` now also requests `memberFollowers` (the field already existed in the schema)
  - the old `common/StudioCard.tsx` and its `.studio-general-card` styles were removed
  - new tokens: `$studio-portrait-width` and `$studio-thumb-width`
- **Skipped:** a city filter (the backend has no city filter, and filtering in the browser would only cover the current page) and a follow button (`getStudios` doesn't return `meFollowed`).
- **Checks:** 13 Studios browser checks pass (search, empty state, Clear search, sort, pasted URL, pagination, row click versus photo click versus heart, tab order, no console errors), the Packages page still passes 31/31, there is no overflow at 1440 / 1024 / 390, and the smallest text is 11px. tsc ✅, lint 0 errors ✅, build: see the report.
- **Update (same day): Studios page rebuilt from the Stitch sketch, using only real data.** The editorial rows were replaced by:
  - a header with a "6 STUDIOS" count and a hairline–monogram–hairline divider
  - a **studio spotlight** (the top `memberRank` studio, page 1 only and not while searching): a large arch portrait in a white frame, a counts line, its 3 newest packages and "View studio"
  - an underlined search with the sort menu
  - a 4-column grid of centred arch tiles (black and white, colour on hover; save heart; location, name, description, counts, "View studio")
  - shared pagination
  - a help banner with the real phone number and "Contact us" (/cs)

  Requests: 1 for the list, plus 2 for the spotlight (the per-row package requests are gone). `StudioRow.tsx` was removed and `StudioCard.tsx` and `StudioSpotlight.tsx` added. Left out from the sketch: ratings, reviews, "patrons", region tabs (no backend filter) and invented copy. 14 browser checks ✅, no overflow at 1440 / 1024 / 390, lint 0 errors ✅, build ✅.

## 2026-10-07 (frontend): Package detail page (/package/detail?id=) redesign
- **CLAUDE.md:** new "Design system" section covering the page shell, tokens, page heading, components (buttons, cards, list controls, sheets) and data rules.
- **Page:**
  - breadcrumb (Packages / City / Title)
  - gallery mosaic (1 photo full width; 2–4 as one large plus two; 5+ as one large plus a 2×2 grid) with a full-screen lightbox (arrows, Esc, swipe, focus trap, focus returns)
  - title block (city — style, title, tier tag, "By studio", outlined like with count, share)
  - 4 key facts
  - "What's included" (Album, Dress, Hair & makeup, honest "Not included")
  - "About" with "Read more" past 480 characters
  - **booking panel:** sticky card on desktop; fixed bottom bar plus sheet on phones. It covers logged out ("Log in to reserve" via `?referrer=`), non-couple accounts, inactive packages, and "Request sent" with a link to My Page reservations.
  - **studio block:** `GET_MEMBER`, with a real Follow via SUBSCRIBE / UNSUBSCRIBE
  - comments (list, pagination, form of 1–100 characters, no stars)
  - similar packages (same city, then same tier, without duplicates or this package, up to 4) using `PopularPackageCard`
  - loading skeleton and a "Package not found" state
- **Logic:**
  - `GET_PACKAGE` (still counts the view), like, `CREATE_COMMENT` and `CREATE_RESERVATION` are kept
  - **fixed:** the comments query had always run with an empty package id
  - **fixed:** the whole page had shown a spinner while similar packages loaded
- **Files:**
  - new `libs/components/package/detail/` (PackageGallery, BookingPanel, StudioBlock, PackageComments)
  - removed `package/Review.tsx`
  - rewrote `pc/package/detail.scss`
  - looks under `.detail-page` in `general.scss`, plus the root-level `.booking-panel`, `.booking-sheet` and `.lightbox`
  - new tokens: `$detail-gallery-height`, `$booking-panel-width`, `$lightbox-bg`
- **Backend check:** the reservation schema is already correct (Date, Number, no `notificationDesc`). `createReservation` works for USER accounts; an unauthenticated probe returned only the token error. Calling `getMember` from this page records one studio view per logged-in visitor (deduplicated).
- **Checks:** 20 logged-out browser checks ✅ and 9 mosaic/lightbox checks ✅ (5 photos simulated in the test browser only), no overflow at 1440 / 1024 / 390, lint 0 errors ✅, build ✅. Logged-in like / comment / reservation tests are waiting for a test couple login.

## 2026-10-07 (frontend): Studio detail page (/studio/detail?studioId=) redesign
- **Page:** `withLayoutFull`, sections in this order:
  - breadcrumb (Studios / City / Name)
  - **hero:** framed arch portrait (black and white, colour on hover; initial on sand with no photo), location, display name, description (2 lines), counts above 0, a primary Follow without the arrow (outlined "Following"), and an outlined heart with the like count
  - **"Packages by tier":** Pearl / Gold / Diamond cards with count and "From ₩…", or a dashed "Not offered"; a card filters the grid
  - **packages:** tier chips, sort (Newest, Price low to high, Most liked), and "Show more" in steps of 6
  - **"Portfolio":** masonry of package photos linking to their packages, with "View all" in the shared viewer; hidden under 3 photos
  - comments for the studio (none on your own studio)
  - "More studios in {city}" with the shared studio tiles (hidden when none)
- **States:** skeleton, "Studio not found", and "{name} hasn't published any packages yet."
- **Data and requests:**
  - `GET_MEMBER` (still counts the view; now also asks for `meLiked`)
  - one `GET_PACKAGES` with `memberId` and limit 100; tiers, filters, sort and portfolio are worked out in the browser
  - `GET_COMMENTS` (group MEMBER)
  - one `GET_STUDIOS`, filtered to the same city by address
  - follow via SUBSCRIBE / UNSUBSCRIBE, and likes via LIKE_TARGET_MEMBER and LIKE_TARGET_PACKAGE
- **Privacy:** the studio phone number is no longer shown publicly.
- **Shared code:**
  - `PhotoLightbox` and `CommentsSection` are now in `libs/components/common` and used by both detail pages
  - removed `ReviewCard.tsx`, `PackageBigCard.tsx` and their dead styles (plus `.page-label`, which the Packages header no longer uses)
- **Backend:** `memberPackages` is now correct for all studios. No changes were needed.
- **Checks:** 23 Studio Detail browser checks ✅ (no-photo and no-packages simulated in the test browser only), Package Detail still 20/20 and 9/9, no overflow at 1440 / 1024 / 390, lint 0 errors ✅, build ✅. Logged-in follow / like / comment tests are waiting for a test couple login.
- **Update (same day): studio photos are in full colour everywhere** (homepage cards, the studios list and spotlight, Studio Detail, and the Package Detail studio block). Shared mixins `portrait-light` and `portrait-light-on` in `variables.scss`: on hover a champagne arch line rises inside the photo, a soft light sweeps across, and unframed photos zoom slightly (framed ones don't, so the frame stays). Reduced motion shows it at once. All grayscale rules were removed and the CLAUDE.md design system updated.

## 2026-10-07 (frontend): My Page (/mypage) redesign, phase 1
- **Shell:** `withLayoutFull` and the 1300px container. The left menu and its account-type label are replaced by underlined tabs, using the same `?category=` values; Overview is the new default. Logged-out visitors go to login (`?referrer=` returns them to the same tab).
- **Header:** small framed arch avatar, "Welcome back, {name}", "Member since {month year}" (`GET_MEMBER` of yourself), and quiet counts above 0.
- **"Your next shoot" (couples):** the nearest upcoming pending or confirmed reservation, with package photo, date, status and a 4-step track (Requested, Confirmed, Shoot day, Completed, using the real dates), plus View package and Cancel request. Studios see "N requests waiting" with Confirm / Decline.
- **Overview:** reservation, saved, recently viewed and post previews, each with "See all".
- **Rewritten:**
  - Reservations: status chips, the shared `ReservationCard` (actions follow the backend rules, with a confirm dialog), shared pagination
  - Saved and Recently viewed: `PopularPackageCard` grids
- **Removed:** `MyMenu.tsx` and the myReservations / myFavorites / mySaved styles. `mypage.scss` is now the new layout.
- **Phase 2 (not done yet):** Following, Followers, My posts, Write a post, Profile, My packages and Add package still use their old components inside the new shell.
- **Checks:** tsc ✅, lint 0 errors ✅, build ✅, logged-out redirect ✅. Logged-in visual and behaviour checks are waiting for a test couple login.
- **My Page phase 2 (same day):** every section now uses the new design:
  - **Following / Followers:** new `MyFollowList` (avatar, name, location and counts, Follow / Following) on `GET_MEMBER_FOLLOWERS` / `GET_MEMBER_FOLLOWINGS` and the page's subscribe / unsubscribe handlers. The old `member/MemberFollowers` and `MemberFollowings` stay for /member.
  - **My posts:** `CommunityCard` grid plus "Write a post". **Write a post:** the unchanged community editor in a frame.
  - **Profile:** photo upload, nickname, full or studio name (new, optional), phone, address, and "About" (new, optional, shown on the studio page), using the same UPDATE_MEMBER and token refresh. The photo is no longer required to save.
  - **My packages (studios):** status chips (Published, Paused, On hold), rows with Edit / Pause or Publish / Delete (with confirm), using the same UPDATE_PACKAGE.
  - **Add / edit package:** grouped form (Basics, Location, The shoot, Description, Photos) with the backend limits, same CREATE_PACKAGE / UPDATE_PACKAGE and multipart upload. GET_PACKAGE is skipped when not editing.
  - Studio-only tabs fall back to Overview for other accounts.
- **Removed:** the addNewPackage / myPackages / myProfile / myArticles / writeArticle styles (ids no longer used).
- **New tokens:** `$error-ink` and `$select-chevron`.
- **Checks:** tsc ✅, lint 0 errors ✅, build ✅, logged-out redirect ✅. The logged-in check was done by the user (phase 1).
- **My Page "album" redesign (same day):**
  - **Header ("album cover"):** a tinted band with a large "Welcome back, *name*" (the name in mocha), the arch avatar, "Member since" and counts. On the right, a fan of up to 3 printed photos (your saved packages, or a studio's own packages) that spread on hover.
  - **Tabs:** a pill bar with the active tab raised in white.
  - **"Your next shoot":** an invitation card with a champagne double line and the date set large ("OCTOBER 2026 / 24 / SATURDAY"), plus the package photo in an arch window (`portrait-light` effect).
  - **New tokens:** `$print-width`, `$print-shadow`, `$tab-raise`, `$invite-line`, `$invite-line-soft`, `$my-prints-width`, `$my-greeting-size`.
  - **Bug fixed:** members without a photo carry a local placeholder path in the token, which the navbar turned into a broken image URL and the profile form would have saved as a photo. The new `memberPhoto()` helper in `studioSearch.ts` treats it as "no photo" (used by Top.tsx, MyHeader and MyProfile).
  - **Checks:** previewed logged-in as a couple with test-browser-only data, at 1440 and 390, with no overflow and no errors. tsc ✅, lint 0 errors ✅, build ✅.
- **My Page cleanup (same day):**
  - The Overview no longer repeats saved packages; the Saved tab, the navbar heart and the header prints cover them.
  - Following and Followers left the tab bar. The header counts link to them, and they open in a side panel (full screen on phones) with a Following / Followers switch; old `?category=followings|followers` links open the same panel.
  - Rows use a compact toggle (outlined "Follow", or a soft filled "✓ Following").
  - Checked with test-browser-only data, no errors. tsc ✅, lint 0 errors ✅, build ✅.
- **Follow made more visible (same day):**
  - **`FollowerStack`** (new, `libs/components/common`): up to 3 overlapping faces from the public followers / followings query, plus a large count; it can act as a button.
  - **My Page header:** "N following" / "N followers" stacks open the follow panel; the stats line keeps liked and reservations.
  - **Studio Detail:** a solid Follow pill with a plus in a circle (the plus turns on hover), a sand "✓ Following" state with a pop animation when you follow, and the studio's follower stack, which refreshes after a follow.
  - The "Save"-style wording for hearts was also renamed to "Liked" across the site.
  - **New token:** `$stack-face`. Reduced motion turns off the pop and hover moves.
  - **Checks:** Songdo's real 2 followers render; clicking a My Page stack opens the panel. tsc ✅, lint 0 errors ✅, build ✅.
- **Follow simplified (user's choice, "Simple and clean"):** the face stacks and the icon follow button were removed (`FollowerStack.tsx`, its styles and the `$stack-face` token deleted).
  - **Studio Detail:** the standard "Follow" button (outlined "Following" after), with "N followers" as plain text beside it; on your own studio the count is in the stats line.
  - **My Page:** two plain pills, "4 Following" and "1 Follower", that open the follow panel.
  - lint 0 errors ✅, build ✅.
- **Studio followers panel:** on Studio Detail, "N followers" is now an outlined pill that opens a "Followers of <studio>" side panel (bottom sheet on phones).
  - It reuses `MyFollowList`, which takes a new optional `memberId`. The public followers query runs with `followingId: studioId`, and each row has a Follow toggle.
  - The rows now use `memberPhoto()`, so the login placeholder photo no longer breaks them.
  - The one-line hero row was undone: the stats sit on their own line, with the actions below them.
  - Follow and the heart use a new compact size, `$btn-height-sm` (40px) and `$btn-pad-x-sm`.
  - **Checks:** Songdo's 2 real followers show at 1440 and 390, and the close button works. tsc ✅, lint 0 errors ✅, build ✅.
- **Studios: why the spotlight studio is first.** Every studio's `memberRank` is 0 until the nightly batch runs (packages×5 + posts×3 + likes×2 + views), so the spotlight used to be an arbitrary tie.
  - `StudioSpotlight` now loads the top 50 studios and picks the leader by rank, then likes, then views, then followers.
  - The eyebrow names the first number where the studio leads every other one ("Top ranked studio", "Most liked studio", "Most viewed studio" or "Most followed studio"). One plain sentence (`.spotlight-why`) explains it, and that number is darker in the stats line (`.lead`).
  - With no clear lead, it falls back to "Studio spotlight" with no claim.
  - **Checks:** real data shows "Most liked studio · Blanc has more likes than any other studio." at 1440 and 390. tsc ✅, lint 0 errors ✅, build ✅.
- **Community list page redesign (`/community`).** It uses `withLayoutFull` with no banner. URL state is `?input=<JSON>` (category, text, sort, page), and old `?articleCategory=` links still work.
  - **Header:** "COMMUNITY" eyebrow, "Stories from couples", a muted line, and "Write a post". Logged out, that button goes to `/account/join?referrer=/mypage?category=writeArticle`.
  - **Tabs:** All · Free talk · Recommendations · News · Humor, using the existing enum (unchanged).
    - Each tab shows a count from a `limit: 1` query.
    - The arrow keys and Home / End move between tabs.
    - Search posts (titles only) and the sort menu (Newest / Most liked / Most viewed) sit to the right.
  - **Front page** (page 1, no search, and only with at least 4 posts): the lead story is the most-liked post, next to a "Most read" list of the top 5 by views. The backend cannot sort by comments.
  - **Grid:** a 3 → 2 → 1 column grid of the homepage `CommunityCard`, which gained the optional `withFooter` (author and counts) and `likeArticleHandler` props. Pagination is "Showing 1–9 of 24 posts".
  - **Empty states:** "No posts in <category> yet." with "Write the first post"; a search with no results offers "Clear search".
  - **Footer link:** a "Community guidelines" link to `/cs?tab=notice`.
  - **New files:** `libs/components/community/{communitySearch.ts, ArticleBits.tsx, CommunityFront.tsx}`.
  - **Rewritten:** `scss/pc/community/community.scss` (layout only).
  - **Styles:** looks in `pc/general.scss` under `.community-page`, and the phone layout in `mobile/main.scss`, which replaces the old phone placeholder text.
  - **New token:** `$community-avatar`.
  - **Type change:** `BAISearch.articleCategory` is now optional, matching the backend.
  - The card category labels on the homepage and My Page now use the same names (for example "Free talk").
  - **Checks:** 31 checks in the test browser with test-only post data (the backend has 1 post), at 1440, 1024 and 390.
    - Covered: tabs, keyboard, sort, pages 2 and 3, search, an old link, posts without a photo, an empty category, and liking a post and "Write a post" both logged out and logged in.
    - No overflow, no text under 11px, no hydration errors.
  - tsc ✅, lint 0 errors ✅, build ✅.
- **Write a post form matches the design system** (`libs/components/community/Teditor.tsx`, shown at `/mypage?category=writeArticle`). The MUI select, text field and red MUI "Register" button are replaced by the My Page form pieces:
  - category chips with the community labels (Free talk, Recommendations, News, Humor)
  - a title field with a 0 / 50 counter
  - the Toast UI editor in `.editor-frame`, restyled with hairlines, an ivory toolbar and site fonts; WYSIWYG only, with no Markdown tab
  - a `.button-primary` "Publish post"
  - The editor, image upload and `CREATE_BOARD_ARTICLE` are unchanged.
  - **Fixes:**
    - Title and post are both required (it was `&&`).
    - Real error messages are shown instead of always "Please provide all inputs".
    - The "Type here" starting text is gone.
    - The editor no longer loads its own labels ("Write", "Preview", the placeholder) as content. Toast UI loads the container's old HTML when `initialValue` is empty, and React mounts twice in development, so it is now `' '`.
    - The editor no longer grabs focus on load.
    - The first uploaded photo becomes the cover (it used to be the last one).
  - **Backend limit (unchanged, not ours to change without asking):** `articleContent` allows only 3–250 characters, and it is the editor's HTML, so one photo uses about 100 of them.
    - The form shows "N / 250 characters, photos and formatting included" and blocks Publish over the limit with a plain message.
  - **Checks:** 7 checks at 1440 and 390 with a test-only answer for the create mutation (nothing was posted). The published input was exactly `{RECOMMEND, "Our sunset shoot in Jeju", "<p>We booked Songdo for October and loved it.</p>"}`. tsc ✅, lint 0 errors ✅, build ✅.
- **Fix: community skeleton cards.** While the list reloaded (after a tab change, search or sort), each skeleton card's parts sat side by side, because `.article-grid > li { display: flex }` also hit `.card-skeleton`. Only real cards stretch now (`li:not(.card-skeleton)`). Checked with a slowed test response; 31 community checks pass; build ✅.
- **View counts (user's choice) on /package, /package/detail and /studio.** These are real `packageViews` and `memberViews`, shown only when above 0. The backend counts one view per logged-in member.
  - **/package cards:** "· 3 views" after the details line, outside the hover underline. This uses the new optional `showViews` prop on `PopularPackageCard`.
  - **/package/detail:** "3 views" in the header next to "By <studio>" (`.head-views`).
  - **/studio tiles:** for example "2 packages · 2 followers · 3 views", using the new optional `showViews` prop on `StudioCard`.
  - The homepage, My Page, "More studios" and similar-package cards are unchanged.
  - **Checks:** 7 checks with real data. tsc ✅, lint 0 errors ✅, build ✅.
- **View counts as an eye icon next to the heart (user's choice), replacing the "N views" text.**
  - **New component:** `libs/components/common/ViewCount.tsx` (eye and number, with "N views" for screen readers).
  - **/package cards:** a white pill left of the heart on the photo (`.photo-actions`).
  - **/studio tiles:** under the heart, since the arch top has no room beside it (`.photo-actions.stacked`).
  - **/package/detail:** an outlined `.icon-action.icon-stat` (not clickable) before the heart and share buttons.
  - The heart now sits inside `.photo-actions` everywhere the card and tile are used. The positioning rules moved to it, including the phone sizes.
  - **New tokens:** `$photo-chip-bg`, `$photo-chip`.
  - **Checks:** 16 checks at 1440 and 390 with real data.
    - Eye left of the heart, same height and row on /package; directly below the heart on /studio; first in the detail header.
    - No views on the homepage or on similar or studio-detail cards; hearts still positioned correctly there; no overflow.
  - lint 0 errors ✅, build ✅.
- **Studio tiles: eye and heart moved to the photo's bottom-right corner, as one row (eye, then heart).** The user found the stacked pair on the curved arch top odd. The arch's bottom corners are square, so the pair sits cleanly there. The "More studios" tiles use the same spot. 16 checks pass; lint 0 errors ✅, build ✅.
- **Help page redesign (`/cs`).** It uses `withLayoutFull` (no banner), the 1300px container, the shared looks (`.help-page` added to the shared scopes) and a real phone layout, which replaces "CS PAGE MOBILE".
  - **Header:** "HELP", "How can we help?", a muted line and a pill "Search questions" that filters the FAQ as you type.
  - **Tabs:** FAQ · Notices · Contact, in the URL (`?tab=`, `&topic=`, `&question=`), with the same keyboard support as Community. FAQ is the default; the old `?tab=faq` and `?tab=notice` links work.
  - **FAQ:** topic chips (All, Packages, Reservations, Payments, For studios, Community) and accessible accordions (button, `aria-expanded`, region) with a plus that turns into a minus.
    - Searches match across all topics; no results offer "Clear search" and "Contact us".
    - A "Still have a question?" band sits at the end.
  - **Content clean-up (approved):** the FAQ now lives in `libs/components/cs/helpContent.ts`, with 26 answers checked against the app.
    - Removed: the false payment answers (online portal, installments, encryption, early-payment discounts, late penalties) and the 10 "no membership" answers.
    - Fixed: "reviews" became comments; "report to admin" became call us.
    - Added: the real post length limits, and simple posting guidelines.
  - **Notices:** the 2 made-up notices (including a "discount") are removed. There is no notices API, so the tab says "No notices right now." with a link to the FAQ.
  - **Contact:**
    - the real phone line (`tel:`), a "Your reservations" card (logged out, it goes to login and back to the reservations page) and a FAQ link
    - no form (there is no endpoint), and none of the sketch's invented hours, address or reply times
  - **Not built:** the sketch's Terms tab, since there is no terms text.
  - **Link change:** "Community guidelines" on /community now opens `/cs?tab=faq&topic=community&question=community-guidelines`, which opens that answer.
  - **Files:**
    - Rewritten: `pages/cs/index.tsx`, `libs/components/cs/{Faq,Notice}.tsx`, `scss/pc/cs/cs.scss` (layout only).
    - New: `libs/components/cs/{helpContent.ts, Contact.tsx}`, and the `$faq-sign` token.
    - Styles: looks in `pc/general.scss`, phone layout in `mobile/main.scss`.
  - **Checks:** 28 checks at 1440, 1024 and 390, covering tabs, topics, opening and closing answers, search, no results to Contact, the tel link, the logged-out link, an old link, keyboard, the deep link, gutters, overflow and the 11px minimum. lint 0 errors ✅, build ✅.
- **Help content is now written by admins (backend + admin + Help page).** It replaces the hard-coded FAQ.
  - **Backend: new `notice` module** (`apps/la-memoria-api/src/components/notice/*`, `libs/dto/notice/*`).
    - Schema: `NoticeCategory` gained `NOTICE`; there is a new `NoticeTopic` enum (PACKAGES, RESERVATIONS, PAYMENTS, STUDIOS, COMMUNITY), and the `Notice` schema has an optional `noticeTopic`. `availableNoticeSorts` was added.
    - Public: `getNotices(NoticesInquiry)` returns ACTIVE items of one category, optionally by topic or text. FAQ is oldest first; notices are newest first.
    - Admin only (`@Roles(ADMIN)`): `createNotice`, `getAllNoticesByAdmin`, `updateNoticeByAdmin` (edit, ACTIVE / HOLD / DELETE) and `removeNoticeByAdmin` (only once DELETE).
    - Limits: title 3–150, content 3–3000.
  - **Seed:** a one-time script (kept outside the repo) added the 26 approved FAQ answers to the local database as ACTIVE FAQ items owned by the Admin account. Running it again skips titles that already exist.
  - **Admin:** `/_admin/cs/faq` and `/_admin/cs/notice` are now real, through the shared `libs/components/admin/cs/NoticeManager.tsx`:
    - status tabs with counts, a topic filter (FAQ) and pagination
    - a status dropdown per row, Edit and Remove (for Deleted items only)
    - an add/edit dialog with validation and counters
    - The old placeholder `FaqList.tsx` and `NoticeList.tsx` were deleted. The 1:1 inquiry page is unchanged.
  - **Help page:** FAQ and Notices load from `getNotices`, with skeletons and empty states.
    - The FAQ is loaded once and filtered by topic and search in the browser.
    - Line breaks that admins type are kept.
    - Notices show their date.
    - `helpContent.ts` now holds labels only.
    - The "Community guidelines" link became `/cs?tab=faq&q=guidelines`: it pre-fills the search, and a single match opens.
  - **Frontend files:** types `libs/types/notice/*`, enum `libs/enums/notice.enum.ts`, and the `GET_NOTICES`, `GET_ALL_NOTICES_BY_ADMIN`, `CREATE_NOTICE`, `UPDATE_NOTICE_BY_ADMIN` and `REMOVE_NOTICE_BY_ADMIN` operations.
  - **Checks:**
    - API: create, public, hold-hides, remove needs DELETE, validation and non-admin refused. Test items were cleaned up.
    - Admin browser test, 11 checks: add, appears on Help under its topic, hold, delete, remove, back to 26.
    - Help page: 28 checks.
    - Results: backend tsc ✅, frontend tsc ✅, lint 0 errors ✅, build ✅.
  - **Found, not fixed (needs a decision):** `auth.module.ts` reads `process.env.SECRET_TOKEN` before `ConfigModule` loads `.env`, so JWTs are signed and verified with the literal string "undefined". Anyone can forge a token, admin included.
- **Contact form → admin inbox (Help page Contact tab and homepage "Write to us").** User's choices: messages go to an admin inbox (not real email), anyone can send, and the homepage shows the same form.
  - **Backend: new `inquiry` module** (`components/inquiry/*`, `libs/dto/inquiry/*`, `schemas/Inquiry.model.ts`, `libs/enums/inquiry.enum.ts`), with its own `inquiries` collection.
    - Fields: name, email, message, status NEW / ANSWERED / DELETE, and an optional memberId when the sender was logged in.
    - Public `createInquiry`: name 2–50 characters, a valid email, message 10–2000 characters, and at most 3 messages per email address in 10 minutes (new `Message.TOO_MANY_INQUIRIES`).
    - Admin only: `getAllInquiriesByAdmin`, `updateInquiryByAdmin` and `removeInquiryByAdmin` (only once DELETE).
  - **Frontend:**
    - `libs/components/common/ContactForm.tsx`: labels, inline errors with `aria-invalid` and focus on the first bad field, a character counter, a hidden trap field for bots, a logged-in member's name filled in, and a thank-you state that says the reply address.
    - Help Contact tab: the form on the left, with the phone, reservations and FAQ cards stacked on the right.
    - `libs/components/homepage/HomeContact.tsx`: a tinted "Write to us" section, the last one before the footer.
    - Admin `/_admin/cs/inquiry`: `InquiryManager` (New / Answered / Deleted / All with counts, a View dialog with "Reply by email" (mailto) and "Mark answered", status changes and Remove). The old shell `InquiryList.tsx` was deleted.
    - Looks are in a top-level `.contact-form` block in `pc/general.scss`; layout is in `pc/cs/cs.scss`, `pc/homepage/homepage.scss` and `mobile/main.scss`.
  - **Checks:**
    - API: validation, the 10-minute limit and admin-only access.
    - Browser, 18 checks: empty send, bad email, real send and thank-you, on both pages at 1440 and 390, plus overflow at 1024.
    - Admin inbox, 6 checks: counts, view, reply link, mark answered, delete, remove.
    - Help suite: 28 checks.
    - All test messages were removed. backend tsc ✅, frontend tsc ✅, lint 0 errors ✅, build ✅.
- **Help Contact tab: removed the "Quick answers / Read the FAQ" card** (the FAQ is already a tab on the same page). The side column keeps the phone and reservations cards; `Contact` no longer takes `onFaq`. The homepage "Write to us" section keeps its FAQ link. 28 Help checks pass; lint 0 errors ✅, build ✅.
- **Admin area, option B: cleanup and dashboard (frontend only, no backend change).**
  - **Dashboard (`/_admin`):** `libs/components/admin/AdminDashboard.tsx` replaces the redirect to Users.
    - Count tiles: members (with studios · couples), active packages, pending reservations (with confirmed), new messages (highlighted when above 0) and community posts. Each links to its page.
    - "Latest reservations" (5) and "New messages" (5) panels.
    - Every number comes from the existing admin queries with `limit: 1` (metaCounter).
  - **Menu:**
    - a Dashboard item
    - "Cs" renamed to "Help"
    - the missing 1:1 Inquiry link added
    - icons follow the text colour
  - **Brand colours, admin only:**
    - `LayoutAdmin` wraps the admin area in its own MUI theme (primary espresso, secondary mocha, ivory background), so the public site keeps its theme.
    - `scss/pc/admin/admin.scss` has no template red left: the active tab, menu item and actions are espresso, the page background is ivory, and inactive tabs are `$muted`.
    - The status badges keep their meaning colours.
  - **Tables:**
    - New shared `libs/components/admin/adminLabels.ts`: Couple / Studio / Admin, readable statuses, badges coloured by meaning, and member links (studios go to their studio page).
    - Users: readable headers, `memberPhoto()` (no broken placeholder), real status colours.
    - Packages: Package ID, ₩ via `formatKRW`, readable location and tier, a readable location filter, and a "Deleted" tab.
    - Reservations: ₩ instead of "$", readable headers and status. They stay view-only, because the backend has no admin mutation; studios and couples manage them.
    - Community: "Arricle List" became "Community posts", readable categories and statuses, `memberPhoto()`, YYYY-MM-DD dates, debug `console.log`s removed.
  - **Lint:** fixed the existing `react/display-name` error in `LayoutAdmin`.
  - **Checks:**
    - 18 browser checks: every tile equals the API count, links, panels, the menu, each table's labels and values, no red anywhere.
    - A package status round trip, restored afterwards, including clearing the `pausedAt` the pause wrote.
    - tsc ✅, lint 0 errors ✅, build ✅.
- **Fix: "Allowed only for members with specific roles!" on My Page for the admin.**
  - **Cause:** `MyOverview` always ran `getMyReservations` or `getStudioReservations`, which the backend only allows for USER or STUDIO.
  - **Fix:** `MyOverview` takes `isAdmin` and skips the reservation and recently-viewed queries for the admin. The admin's overview shows an "Open the admin area" band (`.admin-note`) above its posts.
  - **Direct links:** `/mypage?category=myReservations | myFavorites | recentlyVisited` fall back to the overview for the admin, the same way studio-only sections already do for couples.
  - **Checks:** admin `/mypage` and `?category=myReservations` show no popup; a real couple account still sees its reservations. tsc ✅, lint 0 errors ✅, build ✅.
- **Log in / sign up redesign (`/account/join`).**
  - **Layout:** `withLayoutFull(Join, { footer: false })`, with a new `footer` option (default on). A split screen: the left half is `/img/home/hero.png` with a gradient and "Your love story starts here."; the right half is a 420px form (`$account-form-width`). On phones the photo is a 30vh band (`$account-photo-mobile`) with the form below.
  - **URL:**
    - `?mode=login|signup` picks the form, and the Log in · Sign up toggle updates it.
    - `?type=studio` pre-selects the studio card; the footer's "Join as a studio" link uses it.
    - `?referrer=` is followed only for paths on this site (`safeReferrer`).
  - **Files:** `libs/components/account/` holds:
    - `accountRules.ts`: rules and hint checks in one place
    - `AccountField.tsx`: label, input, ticking rules, inline error and Show / Hide
    - `LoginForm.tsx` and `SignupForm.tsx`
    - The page only handles layout, mode and redirects.
  - **Rules (from the backend's MemberInput / LoginInput):**
    - nickname 3–12 characters, password 5–12, confirm must match
    - phone is a frontend-only check (9–15 digits, spaces / - / + allowed), because the backend accepts any non-empty phone
    - account type is couple (USER) or studio only
  - **After success:** back to the referrer; otherwise home, or My Page for a new studio. Logged-in visitors to this page go home.
  - **`libs/auth`:** `logIn` and `signUp` now throw an Error with a plain message ("Wrong password.", "No account with this nickname.", "This nickname or phone number is already used.", …) instead of silently calling `logOut()` and reloading. All `console` logging of the form and the password is removed (the old page also used `type="text"` for passwords and logged them).
  - **Removed:** the dead "Lost your password?" link and "Remember me" box. Password reset, terms and social login do not exist in the backend.
  - **Backend (approved):** `MemberService.signup` refuses `memberType: ADMIN` (`Message.NOT_ALLOWED_REQUEST`). Before this, anyone could create an admin account through the API.
  - **Styles:**
    - New shared mixins `form-label`, `form-input` and `form-error` in `variables.scss`; the contact form now uses them too.
    - Looks in `pc/general.scss` under `.account-page`.
    - `pc/account/join.scss` was replaced (layout only); phone layout in `mobile/main.scss`.
    - Lint fix: `LayoutFull` names its component (`react/display-name`).
  - **Checks:** 25 tests against the live backend.
    - layout at 1440, 1024 and 390, URL modes, autocomplete
    - empty and invalid fields, a taken nickname
    - couple and studio signup, wrong password, unknown nickname, Show / Hide
    - return to a package page, logged-in visitors sent home, an unsafe referrer ignored, no password in the console, ADMIN refused
    - The 2 test accounts were deleted afterwards, along with their 3 view records, with the counts lowered again.
    - backend tsc ✅, frontend tsc ✅, lint 0 errors ✅, build ✅.
- **Log in / sign up, second design (user's choice: no image, as simple as possible).** One centred 420px column under the header: the LM monogram, a heading ("Welcome back" / "Create your account"), the Log in · Sign up toggle, then the form. The standard footer is back.
  - Removed: the photo and its styles, the `$account-photo-mobile` token and the `footer` option on `withLayoutFull` (no longer used).
  - The forms, rules, messages, redirects, `libs/auth` changes and the backend ADMIN check are unchanged.
  - **Checks:** 25 tests pass again (layout at 1440, 1024 and 390, then every flow). The test accounts and their views were removed. lint 0 errors ✅, build ✅.
- **Log in / sign up: no footer (user's choice).** `withLayoutFull(Join, { footer: false })`, with the `footer` option back on `withLayoutFull` (default on, so every other page keeps its footer). `#account-page` has `min-height: 100vh`. The monogram was removed from the page by the user, and its unused `.account-mark` style is deleted. Checks: no footer and no overflow at 1440 and 390 in both modes, and /package and /cs still have the footer. lint 0 errors ✅, build ✅.
- **Security: JWT secret fixed.** `auth.module.ts` now uses `JwtModule.registerAsync`, reading `SECRET_TOKEN` when the module starts, and the server refuses to start without it. Before this, the secret was read before `.env` loaded, so every token was signed with "undefined" and anyone could forge any login, admin included. Verified: a forged token is refused ("invalid signature") and a real token works. Logins made before the fix need to log in again.
- **Google sign-in (built; switched on by a client ID).**
  - **Backend:**
    - Package: `google-auth-library@^10.9.1`, chosen because 11 needs Node 22 and the API runs on Node 20.
    - Enum and schema: `MemberAuthType.GOOGLE`; `memberGoogleId` (unique, sparse, not selected by default); `memberPassword` is only required for non-Google members.
    - `AuthService.verifyGoogleToken` checks the token's audience against `GOOGLE_CLIENT_ID`. `createToken` leaves `memberGoogleId` out of the JWT.
    - `googleAuth(GoogleAuthInput)`: a linked member logs in (blocked and deleted members are refused). A new Google user without nickname and phone gets "Google sign-up needs more details!", and with them is created as a USER or STUDIO member (ADMIN refused).
    - Password login of a Google account says "This account signs in with Google!".
  - **Install note:** `yarn add` pruned 8 npm-installed packages (axios and its peers, plus some dev tools), and the API crashed with "Cannot find module 'axios'". Restored with `npm install` (the backend is managed by npm). `yarn.lock` was put back to git, and the API was confirmed starting. Keep using npm in the backend, or list axios in package.json.
  - **Frontend:**
    - `REACT_APP_GOOGLE_CLIENT_ID` goes through `next.config.js` to `libs/config.ts` (`GOOGLE_CLIENT_ID`). The button is hidden while it is empty.
    - `apollo/user/mutation.ts`: `GOOGLE_AUTH`.
    - `libs/auth`: `googleLogIn(idToken, details?)` returns 'done' or 'needs-details'.
    - New `libs/components/account/`:
      - `GoogleButton.tsx`: loads Google's script once and draws Google's "Continue with Google" button, plus an "or" line.
      - `GoogleFinishForm.tsx`: account type, a nickname suggested from the Google name, phone.
      - `AccountTypeCards.tsx`: shared with SignupForm.
  - **Fixes found while testing:**
    - **Duplicate messages:** `apollo/client.ts` showed a popup for every GraphQL error, so forms showed their message twice. Requests with `context: { quiet: true }` (log in, sign up, Google, contact form) now skip the popup.
    - **Redirect race:** a race could send a fresh login home instead of to its referrer; the "already logged in" redirect now waits one tick.
    - **Double button:** the Google button was drawn twice in dev (React runs effects twice); the box is cleared first.
  - **Checks:**
    - Password-login suite: 26 checks, including no popups on wrong password or taken nickname.
    - Google flow with Google's script and the googleAuth answers simulated in the test browser: 9 checks, 3 runs in a row (one button, finish step, prefilled nickname, studio → My Page, returning user → referrer, bad token message, no popups, 390px).
    - Live API: fake Google tokens refused; password signup and login still work.
    - Test data removed. frontend tsc ✅, backend tsc ✅, lint 0 errors ✅, build ✅.
  - **To switch it on:** create an OAuth client ID (Web application, origin http://localhost:3000), then set `REACT_APP_GOOGLE_CLIENT_ID` in la-memoria-next `.env.development` and `GOOGLE_CLIENT_ID` in la-memoria `.env` (both keys were added empty). Restart both servers.
- **Notifications: header bell (replaces the header search button).** User's choices: real notifications in the backend; events are reservations and likes; the search button goes.
  - **Backend (new `components/notification/`, uses the existing `Notification` schema and enums):**
    - `NotificationService.notify(input)`: called by other services. It skips a member's own action, sends a LIKE only once per person and item (taking a like back and giving it again does not repeat it), and never stops the action if saving fails.
    - Queries and mutations (all `AuthGuard`, own notifications only): `getNotifications(input: {page, limit ≤ 50})` (newest first, with `authorData`), `getUnreadNotifications: Int`, `readNotification(notificationId)`, `readAllNotifications: Int`.
    - New lookup `lookupAuthor` in `libs/config.ts`. `NotificationModule` is imported by Reservation, Package, Member and BoardArticle modules.
    - Created on:
      - `createReservation`: REQUESTED to the studio — `requested "<package>" for 8 Nov 2026`.
      - `updateReservation`: CONFIRMED / COMPLETED / CANCELLED to the other side (studio → couple, couple → studio) — `confirmed your reservation for <day>`.
      - `likeTargetPackage` / `likeTargetMember` / `likeTargetBoardArticle`, only when the like is added: `liked your package "<title>"`, `liked your studio` (or `liked your profile`), `liked your post "<title>"`.
    - `notificationTitle` holds the sentence after the author's nickname; the frontend shows the nickname in bold before it.
  - **Frontend:**
    - `libs/components/common/NotificationBell.tsx`: bell with an unread count (refreshed every minute, quiet: no error popups), and a panel (MUI Popover) with the newest 10, the author's photo, relative time and an unread dot. A click marks it read and opens the reservation list, package, studio or post. "Mark all as read" when anything is unread; a plain empty line otherwise. Hidden when logged out.
    - `Top.tsx`: the bell replaces `icon-btn search-btn`. The badge class is now the shared `.count-badge` (heart and bell).
    - Types `libs/types/notification/`, enums `libs/enums/notification.enum.ts`, Apollo `GET_UNREAD_NOTIFICATIONS`, `GET_NOTIFICATIONS`, `READ_NOTIFICATION`, `READ_ALL_NOTIFICATIONS`.
    - Styles: `.notification-panel` in `pc/general.scss` (one width for both: `min(380px, 100vw - 32px)`), reduced-motion rule added.
    - Phone header: the bell now shows on phones too, so the logo is drawn at its default size (150px) through `AnimatedLogo`'s props (the old CSS only shrank the wordmark, not the monogram) and the header buttons are 36px. Everything fits at 360px and 390px with the 24px gutter.
    - `/community/detail` takes the board name from the post when the link has only `?id=` (notification links).
  - **Checks:**
    - Live API, 11 checks: each event, one LIKE after like/unlike/like, nothing for your own like, the right receiver for each status change, newest first with author, read one, read all, another member cannot read yours.
    - Browser at 1440 and 390 with real notifications: no bell when logged out; badge 3; panel text; a click opens the package and the badge drops to 2; mark all clears it; no page errors.
    - All test likes, reservations and notifications removed and counts restored.
    - backend tsc ✅, frontend tsc ✅, frontend lint 0 errors ✅, build ✅. (The backend's strict type-aware lint already fails in many untouched files; the new code follows the same patterns.)
