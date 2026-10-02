# Backend Migration: Nestar → La Memoria

_Last updated: 2026-10-03 · Branch: `modification` · Status: Layer 1 (rename) done and staged, not committed_

## 1. Original project: Nestar

| Aspect | Detail |
|---|---|
| Domain | Real-estate marketplace. Agents list properties; users browse, like, save and comment. |
| Stack | NestJS 10 monorepo, GraphQL (Apollo 4, code-first, `autoSchemaFile: true`), Mongoose 8 / MongoDB, JWT auth, `graphql-upload` file uploads, WebSocket chat (`@nestjs/platform-ws`), `@nestjs/schedule` cron |
| Apps | `apps/nestar-api` (GraphQL API) and `apps/nestar-batch` (cron ranking and rollback, webpack build) |
| Components | `auth`, `member`, `property`, `board-article`, `comment`, `like`, `view`, `follow`, plus `socket` and `database` |
| Collections | `members`, `properties`, `boardArticles`, `comments`, `likes`, `views`, `follows`, `notices`, `notifications` |
| Roles | `MemberType { USER, AGENT, ADMIN }` |

## 2. New project: La Memoria

| Aspect | Detail |
|---|---|
| Domain | Wedding photoshoot studio marketplace. Studios publish photoshoot packages; couples browse, save, follow studios and comment. |
| Architecture | Same as Nestar: same stack, same module layout, same aggregation patterns |
| Apps | `apps/la-memoria-api` and `apps/la-memoria-batch` (**renamed in Layer 1**) |
| Role mapping | Agent → **Studio** (`memberType: STUDIO`, still a `Member` document) · User → **Couple** (enum value stays `USER`) · Admin is unchanged |
| Listing mapping | Property → **Package** (owned by the studio's `memberId`) |

## 3. Migration goal

Turn Nestar into La Memoria by **reusing the architecture 1:1** and changing only the identifiers and the domain vocabulary. The work runs in layers so every step can be checked on its own:

| Layer | Scope | Status |
|---|---|---|
| **L1: Safe rename** | Nestar → La Memoria for project, app, package and label identifiers. No API, schema or logic change. | ✅ Done, staged (uncommitted) |
| **L2: Domain rename** | Property → Package, Agent → Studio across enums, schemas, DTOs, services, resolvers, GraphQL operations and batch | ⏳ Planned |
| **L3: Domain fields** | Real-estate fields → photoshoot fields (see §7). Resolve the ER-diagram differences first. | ⏳ Blocked on decision D7 |
| **L4: Optional extensions** | `reservations` collection, as drawn in `La-MemoriaER.pdf` | ❓ Undecided (D11) |

## 4. Naming changes

### 4.1 Done in Layer 1

| Kind | Before | After |
|---|---|---|
| npm package | `nestar` | `la-memoria` (`package.json` and `package-lock.json`) |
| API app folder / Nest project | `apps/nestar-api` / `nestar-api` | `apps/la-memoria-api` / `la-memoria-api` |
| Batch app folder / Nest project | `apps/nestar-batch` / `nestar-batch` | `apps/la-memoria-batch` / `la-memoria-batch` |
| Build output | `dist/apps/nestar-*` | `dist/apps/la-memoria-*` |
| Absolute import prefix | `'apps/nestar-api/src/…'` | `'apps/la-memoria-api/src/…'` |
| API welcome string | `Welcome to Nestar Rest API server!` | `Welcome to La Memoria GraphQL API server!` |
| Batch welcome string | `Welcome to Nestar BATCH API server!` | `Welcome to La Memoria BATCH API server!` |
| DB log label | `=== MongoDB is connected into … db ===` | `=== La Memoria MongoDB is connected into … db ===` |
| Batch e2e import | `NestarBatchModule` (did not exist) | `BatchModule` |

### 4.2 Planned for Layer 2

| Kind | Before | After |
|---|---|---|
| Enum value | `MemberType.AGENT` | `MemberType.STUDIO` |
| Group enum values | `CommentGroup` / `LikeGroup` / `ViewGroup` / `NotificationGroup` `.PROPERTY` | `.PACKAGE` |
| Enums | `PropertyType`, `PropertyStatus`, `PropertyLocation` | `PackageType`, `PackageStatus`, `PackageLocation` |
| Member counter | `memberProperties` | `memberPackages` |
| Config | `availableAgentSorts`, `availablePropertySorts`, `availableOptions` | `availableStudioSorts`, `availablePackageSorts`, package options |
| Aggregation aliases | `favoriteProperty`, `visitedProperty` | `favoritePackage`, `visitedPackage` |
| Batch constants | `BATCH_TOP_PROPERTIES`, `BATCH_TOP_AGENTS` | `BATCH_TOP_PACKAGES`, `BATCH_TOP_STUDIOS` |
| DTO classes | `Property`, `Properties`, `PropertyInput`, `PropertyUpdate`, `PropertiesInquiry`, `AgentPropertiesInquiry`, `AllPropertiesInquiry`, `AgentsInquiry` | `Package`, `Packages`, `PackageInput`, `PackageUpdate`, `PackagesInquiry`, `StudioPackagesInquiry`, `AllPackagesInquiry`, `StudiosInquiry` |

## 5. Module changes

| Module | Layer 1 | Layer 2 (planned) |
|---|---|---|
| `components/property/*` | path only | → `components/package/*` (`PackageModule`, `PackageResolver`, `PackageService`, `packageStatsEditor`) |
| `components/member/*` | path only | `getAgents` → `getStudios`; `@Roles(USER, AGENT)` → `@Roles(USER, STUDIO)` |
| `components/like/like.service.ts` | path only | `getFavoriteProperties` → `getFavoritePackages`, `from: 'packages'` |
| `components/view/view.service.ts` | path only | `getVisitedProperties` → `getVisitedPackages`, `from: 'packages'` |
| `components/comment/*` | path only | inject `PackageService`; `CommentGroup.PACKAGE` → `packageComments` |
| `components/components.module.ts` | path only | import `PackageModule` |
| `auth`, `board-article`, `follow`, `socket`, `database`, `interceptor` | import prefix / log label | no domain change |
| `la-memoria-batch` | import prefix, welcome string, e2e spec | register `'Package'` model; `batchTopPackages` / `batchTopStudios` |

## 6. GraphQL changes

**Layer 1 changed nothing in the GraphQL schema.** The running API still serves `getProperties`, `getAgents`, `getMember`, and so on; this was checked against the live schema.

Layer 2 operation renames:

| Nestar operation | La Memoria operation | Guard / role |
|---|---|---|
| `createProperty` | `createPackage` | `STUDIO` |
| `getProperty` | `getPackage` | WithoutGuard |
| `updateProperty` | `updatePackage` | `STUDIO` |
| `getProperties` | `getPackages` | WithoutGuard |
| `getFavorites` | `getFavorites` (unchanged) | Auth |
| `getVisited` | `getVisited` (unchanged) | Auth |
| `getAgentProperties` | `getStudioPackages` | `STUDIO` |
| `likeTargetProperty` | `likeTargetPackage` | Auth |
| `getAgents` | `getStudios` | WithoutGuard |
| `getAllPropertiesByAdmin` | `getAllPackagesByAdmin` | `ADMIN` |
| `updatePropertyByAdmin` | `updatePackageByAdmin` | `ADMIN` |
| `removePropertyByAdmin` | `removePackageByAdmin` | `ADMIN` |
| `imagesUploader(target: "property")` | `imagesUploader(target: "package")` | the server takes any `target`; only the client value changes |

All member, board-article, comment, follow and notice operations keep their names.

## 7. MongoDB collection and schema changes

### 7.1 Collections

| Collection | Layer 1 | Planned |
|---|---|---|
| `properties` | unchanged | → `packages` |
| `members` | unchanged | `memberProperties` → `memberPackages`; `memberType` value `AGENT` → `STUDIO` |
| `notifications` | unchanged | `propertyId` (ref `Property`) → `packageId` (ref `Package`) |
| `likes`, `views`, `comments` | unchanged | group value `PROPERTY` → `PACKAGE` |
| `boardArticles`, `follows`, `notices` | unchanged | unchanged |
| `reservations` | — | present in the ER diagram only; see D11 |

### 7.2 `packages` schema: two sources that disagree (decision D7)

| Nestar `properties` | Session proposal (approved in Q&A) | ER diagram `La-MemoriaER.pdf` |
|---|---|---|
| `propertyType` APARTMENT/VILLA/HOUSE | `packageType` PRE_WEDDING/WEDDING_DAY/STUDIO/OUTDOOR | `packageType` enum |
| — | — | `packageStyle` enum (**new**) |
| `propertyStatus` ACTIVE/SOLD/DELETE | `packageStatus` ACTIVE/PAUSE/DELETE | `packageStatus` enum |
| `propertyLocation` | `packageLocation` (same cities) | `packageLocation` enum |
| `propertyAddress`, `propertyTitle`, `propertyPrice` | `package*` | `package*` (price is a double) |
| `propertySquare` | `packageDuration` (hours) | `packageDuration` double |
| `propertyBeds` | `packagePhotos` | `packagePhotos` int |
| `propertyRooms` | `packageOutfits` | — (not in diagram) |
| `propertyBarter` | `packageAlbum` | `packageAlbum` bool |
| `propertyRent` | `packageVideo` | — (diagram has `packageDress`, `packageMakeup` bools) |
| `propertyViews/Likes/Comments` | `packageViews/Likes/Comments` | **typo in diagram:** still `propertyViews/Likes/Comments` |
| — | — | `packageReservations` int (**new**, depends on D11) |
| `propertyRank` | `packageRank` | `packageRank` |
| `propertyImages` | `packageImages` | **typo in diagram:** `propertyImages[]` |
| `propertyDesc` | `packageDesc` | `packageDesc` |
| `soldAt` | `pausedAt` | — (absent) |
| `constructedAt` | removed | — (absent) |
| `memberId`, `deletedAt`, timestamps | same | same |

The `reservations` collection in the diagram also has a likely copy-paste error: a `notificationDesc` field.

## 8. Compatibility notes

- **Layer 1 is fully backward compatible.** GraphQL schema, collections, model tokens, enum values, `.env` keys (`PORT_API`, `PORT_BATCH`, `MONGO_DEV`, `MONGO_PROD`, `SECRET_TOKEN`) and the upload paths are unchanged, so the current `la-memoria-next` frontend keeps working.
- **Layer 2 is breaking** for the frontend: operation names, enum values and field names change, so the frontend has to change in lockstep (see `FRONTEND_MIGRATION.md`).
- **Database:** decision D6 is a fresh La Memoria database, so no migration script. Pointing L2 code at an existing Nestar DB leaves `properties`, `AGENT` and `PROPERTY` documents invisible to the new queries.
- **Deploy scripts:** anything that ran `dist/apps/nestar-api/main` must now run `dist/apps/la-memoria-api/main` (`npm run start:prod` is already updated).
- **Known bugs inherited from Nestar** (not fixed; L1 changes no logic):
  - `LoggingInterceptor` returns `undefined` for HTTP requests, so every REST route (for example `GET /`) responds 500 ([Logging.interceptor.ts](../apps/la-memoria-api/src/libs/interceptor/Logging.interceptor.ts)). GraphQL is not affected.
  - `getAllPropertiesByAdmin` filters on `match.propertyLocationList`, which is not a field, so the admin location filter never matches ([property.service.ts](../apps/la-memoria-api/src/components/property/property.service.ts)).
  - `getProperties` has a leftover `console.log('match:')`.
