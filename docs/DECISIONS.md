# Architectural Decisions: Nestar → La Memoria

_Last updated: 2026-10-03_

Status key: ✅ Accepted · 🟡 Accepted, not yet implemented · ❓ Open

## Summary

| ID | Decision | Status |
|---|---|---|
| D1 | Keep Nestar's architecture and data model 1:1 | ✅ |
| D2 | A studio is a `Member` (`memberType: STUDIO`), not a separate collection | 🟡 |
| D3 | Property → Package, owned by the studio's `memberId` | 🟡 |
| D4 | Migrate in layers; Layer 1 is a pure rename with no logic change | ✅ |
| D5 | Rename the monorepo apps to `la-memoria-api` / `la-memoria-batch` | ✅ |
| D6 | Fresh La Memoria database, no data migration script | 🟡 |
| D7 | `packages` field mapping | ❓ (session proposal vs ER diagram) |
| D8 | Lint tooling: install ESLint 9 deps; lint without `--fix`; do not fix existing findings in L1 | ✅ |
| D9 | Leave inherited Nestar bugs unfixed in L1 | ✅ |
| D10 | No git commits unless the user asks explicitly | ✅ |
| D11 | `reservations` collection | ❓ |

---

### D1: Keep Nestar's architecture 1:1
- **Decision:** reuse the module layout, services, DTO patterns, aggregation helpers (`lookupMember`, `lookupAuthMemberLiked`, `$facet` pagination), guards and batch jobs unchanged. Change only names and domain fields.
- **Why:** the project owner wants to reuse proven Nestar code with minimal new surface. Extra collections or relationships are work nobody asked for.
- **Risks:** some real-estate concepts (sold state, barter/rent flags) don't fit a photo studio; forcing a 1:1 mapping can produce odd field semantics.
- **Alternatives:** a domain redesign (separate studio entity, bookings, reviews). An early draft did this and the owner rejected it.

### D2: A studio is a Member
- **Decision:** `MemberType { USER, STUDIO, ADMIN }`. The studio profile lives on the member document (`memberFullName`, `memberImage`, `memberAddress`, `memberDesc`), as the agent profile did.
- **Why:** this keeps auth, roles, follow, like and member ranking unchanged. "Follow agent" becomes "follow studio" with no code beyond the rename.
- **Risks:** studio-specific attributes (business hours, portfolio, social links) have no home without adding member fields.
- **Alternatives:** a `studios` collection linked to an owner member. Rejected, per D1.

### D3: Property → Package
- **Decision:** `properties` becomes `packages`, `Property*` types become `Package*`, and Agent-scoped operations become Studio-scoped (`getStudioPackages`). Favorites become saved packages.
- **Why:** a package is the sellable listing a studio publishes, structurally the same as a property.
- **Risks:** a breaking GraphQL change (see FRONTEND_MIGRATION.md), and every `PROPERTY` group enum value has to change at the same time.
- **Alternatives:** keep the backend names and relabel only in the UI. That is cheaper, but it leaves a permanent naming mismatch.

### D4: Layered migration; Layer 1 is a pure rename
- **Decision:** Layer 1 changes only visible project and app identifiers (package name, folders, Nest project names, labels and constants that contain "Nestar"). APIs, collections, model tokens, enums and business logic are not touched.
- **Why:** the owner's explicit instruction. It keeps the diff reviewable: git detects every moved file as a pure rename.
- **Risks:** the repo stays in a mixed state (La Memoria shell, Nestar domain) until Layer 2 lands.
- **Alternatives:** one big-bang refactor. Harder to review and harder to bisect.

### D5: Rename the apps to `la-memoria-api` / `la-memoria-batch`
- **Decision:** `git mv` the folders; update `nest-cli.json`, the `package.json` scripts, the `tsconfig.app.json` outDir and the absolute imports.
- **Why:** app names are user-visible (scripts, `dist` paths, logs) and the owner chose this option.
- **Risks:** external deploy scripts or PM2 configs that use `dist/apps/nestar-*` break.
- **Alternatives:** keep the `nestar-*` folders and rename only the domain.

### D6: Fresh database, no migration script
- **Decision:** point `MONGO_DEV` / `MONGO_PROD` at a new La Memoria database before Layer 2.
- **Why:** there is no production Nestar data to keep, and a migration script would be throwaway work.
- **Risks:** if the Layer 2 code runs against the old Nestar DB, data silently disappears from queries (`AGENT` and `PROPERTY` values, the `properties` collection).
- **Alternatives:** a one-off Mongo script to rename the collection, fields and enum values.

### D7: `packages` field mapping (OPEN)
- **Session proposal** (chosen in Q&A): `propertySquare→packageDuration`, `propertyBeds→packagePhotos`, `propertyRooms→packageOutfits`, `propertyBarter/Rent→packageAlbum/packageVideo`, `SOLD→PAUSE` with `soldAt→pausedAt`, `constructedAt` removed. Type values `PRE_WEDDING/WEDDING_DAY/STUDIO/OUTDOOR`.
- **ER diagram** (`../La-MemoriaER.pdf`) differs: it adds `packageStyle` enum, `packageDress` and `packageMakeup` bools, and `packageReservations`. It has no outfits or video, and it still names `propertyViews/Likes/Comments/Images` (likely typos).
- **Why open:** the two sources conflict. The ER diagram is probably the owner's newer intent, but its typos should not be copied.
- **Risk if not settled:** Layer 3 would encode the wrong schema, and both frontend filters and seed data depend on it.
- **Recommendation:** adopt the ER diagram's field set with the `property*` typos fixed to `package*`, and get explicit confirmation before Layer 3.

### D8: Lint tooling
- **Decision:** the repo's `eslint.config.mjs` is an ESLint 9 flat config that needs `typescript-eslint`, which wasn't installed (ESLint 8.57 was), so lint could not run at all. I installed `eslint@^9`, `typescript-eslint`, `@eslint/js@^9` and `globals`, and removed `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` v6. Lint runs as `npx eslint "apps/**/*.ts"`, without `--fix`.
- **Why:** the owner asked for lint after refactoring. Running without `--fix` keeps lint from rewriting code during a no-logic-change layer.
- **Risks:** 355 existing findings (329 errors, 26 warnings) now show up. `npm run lint` still has `--fix` and would reformat about 94 files.
- **Alternatives:** `npx prettier --check` only, with no dependency change.

### D9: Leave inherited bugs unfixed in Layer 1
- **Decision:** the known Nestar bugs stay as they are for now (REST 500 from `LoggingInterceptor`, admin `propertyLocationList` filter, stray `console.log`).
- **Why:** L1 is defined as changing no logic.
- **Risks:** `GET /` returns 500, and the admin location filter is a no-op.
- **Plan:** fix them in Layer 2 or a dedicated `fix:` commit.

### D10: No commits without an explicit request
- **Decision:** the agent stages work but does not commit. A commit step in an approved plan is not permission to commit.
- **Why:** the owner corrected an unrequested commit (it was undone with `git reset --soft HEAD~1`).

### D11: `reservations` collection (OPEN)
- **Context:** the ER diagram includes `reservations` (status, date, price, note, `studioId`, `memberId`, `packageId`, `confirmedAt`/`cancelledAt`/`completedAt`). Earlier guidance said bookings are optional extras outside the 1:1 model.
- **Risk:** it is a new module with no Nestar counterpart: a new state machine, new notifications and `packageReservations` counters.
- **Recommendation:** treat it as Layer 4, after the 1:1 migration is stable, and confirm scope with the owner first.
