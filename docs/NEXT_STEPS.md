# Next Steps (priority order)

_Written 2026-10-03, for the next working session_

## P0: Unblock

| # | Task | Notes |
|---|---|---|
| 1 | Review and commit the staged Layer 1 rename | Suggested message: `refactor: rename Nestar identifiers to La Memoria`. Owner commits, or explicitly asks the agent to. |
| 2 | Settle **D7**, the `packages` field set | ER diagram vs session proposal; fix the `property*` typos in the diagram (DECISIONS.md D7) |
| 3 | Decide **D11**, `reservations` in or out of scope | It changes whether `packageReservations` exists |
| 4 | Create a fresh La Memoria MongoDB and update `.env` `MONGO_DEV` / `MONGO_PROD` | Required before Layer 2 runs against real data (D6) |

## Backend cleanup

| Priority | Task | Files |
|---|---|---|
| 1 | **Layer 2: domain rename.** Property → Package, Agent → Studio (enums, schemas, DTOs, config, components, batch) | see BACKEND_MIGRATION.md §4.2, §5, §6 |
| 2 | Fix the admin location filter: `match.propertyLocationList` → `match.packageLocation = { $in }` | `components/property/property.service.ts` |
| 3 | Fix REST 500: return `next.handle()` in the `http` branch of `LoggingInterceptor` | `libs/interceptor/Logging.interceptor.ts` |
| 4 | Remove `console.log('match:')` in `getProperties`; fix the indentation of `likeTargetProperty` in the resolver | property service and resolver |
| 5 | **Layer 3: package fields**, per the D7 outcome | `Package.model.ts`, `package.input.ts`, `package.update.ts`, `package.ts`, `config.ts` |
| 6 | Lint debt: run `npx prettier --write "apps/**/*.ts"` as its own formatting-only commit, then work through the `no-unsafe-*` and unused-vars findings | repo-wide |
| 7 | Change `npm run lint` to drop `--fix` (add a separate `lint:fix`) | `package.json` |
| 8 | (If D11 is accepted) Layer 4: `reservations` module | new component |

## Frontend migration (`../la-memoria-next`)

| Priority | Task |
|---|---|
| 1 | Brand rename: `package.json` name, `<title>`/meta in 3 layouts, Footer, `NESTAR … MOBILE` placeholders (16 files) |
| 2 | i18n terminology in `public/locales/{en,kr,ru}/common.json` |
| 3 | After backend L2: rename GraphQL documents in `apollo/user/*` and `apollo/admin/*` |
| 4 | Rename types and enums (`libs/types/property` → `package`, `MemberType.STUDIO`, `*Group.PACKAGE`) |
| 5 | Rename pages (`/property` → `/package`, `/agent` → `/studio`, `_admin/properties` → `_admin/packages`) and components |
| 6 | After backend L3: package form, filters and cards; upload `target: 'package'` |

Full mapping: FRONTEND_MIGRATION.md.

## Testing

| Priority | Task |
|---|---|
| 1 | After each layer: `npx tsc --noEmit` for both apps, `npm run build`, `npm run build:batch`, `git grep -i` for leftover terms |
| 2 | GraphQL playground smoke flow: signup STUDIO → `imagesUploader` → `createPackage` → signup USER → `getPackages` with filters → `getPackage` (views +1) → `likeTargetPackage` → `getFavorites` / `getVisited` → `subscribe` → `createComment` (PACKAGE) → `getStudios` → admin `getAllPackagesByAdmin` with a location filter → `updatePackageByAdmin` |
| 3 | Boot the batch app and trigger the rank jobs against the seeded DB |
| 4 | Fix or replace the e2e specs in `apps/*/test` (they are Nest starter defaults) |
| 5 | Frontend: `yarn build` plus a manual page-by-page smoke test against the L2 API |

## Documentation

| Priority | Task |
|---|---|
| 1 | Update `docs/COMPLETED_TASKS.md` and `docs/BACKEND_MIGRATION.md` status tables after each layer |
| 2 | Record the D7 and D11 outcomes in `docs/DECISIONS.md` |
| 3 | Export the final GraphQL schema (SDL) to `docs/` for frontend reference |
| 4 | Fill in `AGENTS.md` / `SKILLS.md` (both are nearly empty) with the layer rules and the no-commit rule |
| 5 | Update `../La-MemoriaER.pdf` to fix the `property*` typos and the `notificationDesc` field in `reservations` |
