# Frontend Migration Plan: `la-memoria-next`

_Last updated: 2026-10-03 · Repo: `../la-memoria-next` (Next.js 14.2 pages router, Apollo Client 3, MUI, next-i18next en/kr/ru)_

Current state: **the frontend has not been migrated yet.** Its last commit is `20674cb feat: start client migration process`. It still has `"name": "nestar-next"` and "Nestar" in 16 files.

## Step-by-step plan

The steps mirror the backend layers. **Do not start step 3 until backend Layer 2 is merged**, because the GraphQL operations have to change together.

| # | Step | Depends on | Breaking? |
|---|---|---|---|
| 1 | **Brand rename** (Layer 1 equivalent): `package.json` name `nestar-next` → `la-memoria-next`; `<title>` / `<meta title>` in `LayoutBasic`, `LayoutHome`, `LayoutFull`; Footer copyright; mobile placeholder strings `NESTAR … MOBILE` | none | no |
| 2 | **Terminology in i18n** (`public/locales/{en,kr,ru}/common.json`) and hard-coded UI strings (see §4) | none | no |
| 3 | **GraphQL documents**: rename operations and fields in `apollo/user/*.ts` and `apollo/admin/*.ts` (see §3) | backend L2 | yes |
| 4 | **Types and enums**: `libs/types/property/*` → `libs/types/package/*`; `libs/enums/property.enum.ts` → `package.enum.ts`; `MemberType.AGENT` → `STUDIO`; `*Group.PROPERTY` → `PACKAGE`; `memberProperties` → `memberPackages` | step 3 | yes |
| 5 | **Components and pages**: rename files and folders (see §2) and update imports and routes | step 4 | yes (URLs) |
| 6 | **Package fields**: replace beds/rooms/square/barter/rent UI (filters, cards, `AddNewProperty` form) with the D7 package fields | backend L3 | yes |
| 7 | **Uploads**: `imagesUploader` `target: 'property'` → `'package'` (`AddNewProperty.tsx:81`) | none (the server takes any target) | no |
| 8 | **Env and config**: `REACT_APP_API_URL`, `REACT_APP_API_GRAPHQL_URL`, `REACT_APP_API_WS` keep their names; point them at the La Memoria API | none | no |
| 9 | **Verification**: `yarn build`, `tsc --noEmit`, manual smoke test of every page (see NEXT_STEPS.md) | all | — |

## 2. Page and component mapping

### Pages (routes)

| Nestar route / file | La Memoria route / file |
|---|---|
| `pages/index.tsx` | same (homepage) |
| `pages/property/index.tsx` (`/property`) | `pages/package/index.tsx` (`/package`) |
| `pages/property/detail.tsx` | `pages/package/detail.tsx` |
| `pages/agent/index.tsx` (`/agent`) | `pages/studio/index.tsx` (`/studio`) |
| `pages/agent/detail.tsx` | `pages/studio/detail.tsx` |
| `pages/_admin/properties/index.tsx` | `pages/_admin/packages/index.tsx` |
| `pages/mypage`, `pages/member`, `pages/community`, `pages/cs`, `pages/about`, `pages/account/join`, `pages/_admin/{users,community,cs}` | same paths; update terminology only |

Update every `router.push('/property…')` / `'/agent…'` link and the menu entries in `Top.tsx`, `MyMenu.tsx`, `MemberMenu.tsx` and `AdminMenuList.tsx`.

### Components

| Nestar component | La Memoria component |
|---|---|
| `libs/components/property/Filter.tsx` | `libs/components/package/Filter.tsx` |
| `libs/components/property/PropertyCard.tsx` | `libs/components/package/PackageCard.tsx` |
| `libs/components/property/Review.tsx` | `libs/components/package/Review.tsx` |
| `libs/components/agent/ReviewCard.tsx` | `libs/components/studio/ReviewCard.tsx` |
| `libs/components/common/AgentCard.tsx` | `libs/components/common/StudioCard.tsx` |
| `libs/components/common/PropertyBigCard.tsx` | `libs/components/common/PackageBigCard.tsx` |
| `homepage/PopularProperties.tsx` / `PopularPropertyCard.tsx` | `homepage/PopularPackages.tsx` / `PopularPackageCard.tsx` |
| `homepage/TopProperties.tsx` / `TopPropertyCard.tsx` | `homepage/TopPackages.tsx` / `TopPackageCard.tsx` |
| `homepage/TrendProperties.tsx` / `TrendPropertyCard.tsx` | `homepage/TrendPackages.tsx` / `TrendPackageCard.tsx` |
| `homepage/TopAgents.tsx` / `TopAgentCard.tsx` | `homepage/TopStudios.tsx` / `TopStudioCard.tsx` |
| `member/MemberProperties.tsx` | `member/MemberPackages.tsx` |
| `mypage/MyProperties.tsx` | `mypage/MyPackages.tsx` |
| `mypage/AddNewProperty.tsx` | `mypage/AddNewPackage.tsx` |
| `mypage/PropertyCard.tsx` | `mypage/PackageCard.tsx` |
| `admin/properties/PropertyList.tsx` | `admin/packages/PackageList.tsx` |
| `homepage/HeaderFilter.tsx` | same file; filter fields change in step 6 |
| `mypage/MyFavorites.tsx`, `mypage/RecentlyVisited.tsx` | same files; use `Package` types |

## 3. GraphQL rename plan

| Constant (apollo/…) | Old operation → field | New operation → field |
|---|---|---|
| `user/query.ts` `GET_AGENTS` → `GET_STUDIOS` | `GetAgents` → `getAgents` | `GetStudios` → `getStudios` |
| `user/query.ts` `GET_PROPERTY` → `GET_PACKAGE` | `GetProperty` → `getProperty(propertyId)` | `GetPackage` → `getPackage(packageId)` |
| `user/query.ts` `GET_PROPERTIES` → `GET_PACKAGES` | `GetProperties` → `getProperties` | `GetPackages` → `getPackages` |
| `user/query.ts` `GET_AGENT_PROPERTIES` → `GET_STUDIO_PACKAGES` | `getAgentProperties` | `getStudioPackages` |
| `user/query.ts` `GET_FAVORITES`, `GET_VISITED` | unchanged | unchanged (selection set → package fields) |
| `user/mutation.ts` `CREATE_PROPERTY` → `CREATE_PACKAGE` | `createProperty` | `createPackage` |
| `user/mutation.ts` `UPDATE_PROPERTY` → `UPDATE_PACKAGE` | `updateProperty` | `updatePackage` |
| `user/mutation.ts` `LIKE_TARGET_PROPERTY` → `LIKE_TARGET_PACKAGE` | `likeTargetProperty(propertyId)` | `likeTargetPackage(packageId)` |
| `admin/query.ts` `GET_ALL_PROPERTIES_BY_ADMIN` → `GET_ALL_PACKAGES_BY_ADMIN` | `getAllPropertiesByAdmin` | `getAllPackagesByAdmin` |
| `admin/mutation.ts` `UPDATE_PROPERTY_BY_ADMIN` → `UPDATE_PACKAGE_BY_ADMIN` | `updatePropertyByAdmin` | `updatePackageByAdmin` |
| `admin/mutation.ts` `REMOVE_PROPERTY_BY_ADMIN` → `REMOVE_PACKAGE_BY_ADMIN` | `removePropertyByAdmin(propertyId)` | `removePackageByAdmin(packageId)` |

Unchanged: `GET_MEMBER`, `GET_BOARD_ARTICLE(S)`, `GET_COMMENTS`, `GET_MEMBER_FOLLOWERS/FOLLOWINGS`, `SIGN_UP`, `LOGIN`, `UPDATE_MEMBER`, `LIKE_TARGET_MEMBER`, the board-article, comment, subscribe/unsubscribe and member/board-article/comment admin operations. In their selection sets, `memberProperties` → `memberPackages`.

**Input variables:** `PropertiesInquiry.search` keys (`locationList`, `typeList`, `roomsList`, `bedsList`, `squaresRange`, `pricesRange`, `periodsRange`, `options`) follow the backend L2/L3 names. Rename together with `libs/types/property/property.input.ts`.

**Argument names:** the backend L2 plan renames `propertyId` → `packageId` in resolver `@Args`. Confirm this in the backend before changing the client variables.

## 4. UI terminology changes

| Nestar term | La Memoria term (en) |
|---|---|
| Nestar | La Memoria |
| Property / Properties | Package / Packages |
| Agent / Agents | Studio / Studios |
| Top Agents | Top Studios |
| Popular / Top / Trend Properties | Popular / Top / Trending Packages |
| Add New Property / My Properties | Add New Package / My Packages |
| Favorites | Saved Packages |
| Recently Visited | Recently Viewed |
| Follow agent | Follow studio |
| User (buyer) | Couple |
| Sold | Paused (D7 proposal) |
| Bedrooms / Rooms / Square (m²) | Edited photos / Outfits (or Dress/Makeup per ER) / Duration (hours) |
| Barter / Rent | Album / Video (or Dress/Makeup per ER) |
| Apartment / Villa / House | Pre-wedding / Wedding day / Studio / Outdoor |
| Build year | removed |

Update `en`, `kr` and `ru` together. Keep the i18n keys stable where you can (change values, not keys) to keep the diff small.
