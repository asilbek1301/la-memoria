# Prompts

_Prompts from the 2026-10-03 session that worked well, plus templates for the next agent session (Claude Code or Codex)._

## 1. Prompts used in this session

| # | Prompt | Outcome |
|---|---|---|
| 1 | "Analyze current Nestar monorepo structure to transform existing NestJS Monorepo Nestar platform into La Memoria platform." | Full structure analysis and a domain-migration plan |
| 2 | "Safe rename Layer (No Business logic change). Rename all visible project/app identifiers from Nestar to La Memoria. Do Not change domain logic. Keep APIs and database collections unchanged. Update package names, environment labels constants. Run lint and typecheck after refactoring. Please make plan first!" | Narrowed the scope to Layer 1; plan first, then implement. **The most useful prompt this session.** |
| 3 | "implement plan" | Layer 1 implemented and validated |
| 4 | "i didnt ask you to commit" | Established the rule: never commit without an explicit request |
| 5 | "Create a new folder: docs … generate BACKEND_MIGRATION.md, DECISIONS.md, … Do not change application source code." | This documentation set |

## 2. Shared context block (paste at the top of any new session)

```text
Project: La Memoria, a wedding photoshoot studio marketplace. It is a NestJS 10 + GraphQL (Apollo, code-first)
+ Mongoose monorepo migrated from "Nestar" (real estate). Backend: ./la-memoria (apps/la-memoria-api,
apps/la-memoria-batch). Frontend: ../la-memoria-next (Next.js 14 pages router, Apollo Client).

Rules:
- Keep Nestar's architecture 1:1. A studio is a Member with memberType STUDIO (not a new collection).
  Property → Package. No new collections unless I ask.
- Work in layers; each layer has a strict scope. Do not fix unrelated bugs inside a layer, just list them.
- Plan first, then wait for my approval before editing.
- Never git commit or push unless I explicitly say "commit".
- After changes: run tsc --noEmit for both apps, npm run build, npm run build:batch, and
  npx eslint "apps/**/*.ts" (no --fix). Report which lint findings are new and which existed before.
- Read docs/DECISIONS.md and docs/NEXT_STEPS.md before starting.
```

## 3. Reusable prompts for the next session

### 3.1 Backend Layer 2: domain rename
```text
[context block]
Layer 2: Domain rename (no field semantics change).
Rename Property → Package and Agent → Studio across the backend:
enums (MemberType.AGENT→STUDIO, PropertyType/Status/Location→Package*, *Group.PROPERTY→PACKAGE),
schemas (collection 'properties'→'packages', model token 'Property'→'Package', memberProperties→memberPackages,
Notification.propertyId→packageId), DTOs, libs/config.ts sorts/lookups, components/property→components/package,
member getAgents→getStudios, like/view favorite/visited helpers, comment module, batch jobs and constants.
GraphQL operation names follow docs/BACKEND_MIGRATION.md §6.
Keep the existing field set (beds/rooms/square/barter/rent renamed with a package prefix only); real fields come in Layer 3.
Also fix: admin propertyLocationList filter, LoggingInterceptor http branch, stray console.log.
Plan first. Then verify with: git grep -niE "propert|agent" apps (ignore AGENTS.md), tsc, both builds,
lint on changed lines, and the GraphQL smoke flow in docs/NEXT_STEPS.md.
```

### 3.2 Backend Layer 3: package fields
```text
[context block]
Layer 3: Package domain fields. Use the field set decided in docs/DECISIONS.md D7.
Update Package.model.ts, package.input.ts (PackageInput, PackagesInquiry search filters, ranges),
package.update.ts, package.ts, availablePackageSorts/availableOptions in libs/config.ts,
and package.service.ts shapeMatchQuery / status timestamps. Keep every service method's structure unchanged.
Plan first, list the GraphQL input changes the frontend will need, then implement and verify.
```

### 3.3 Frontend brand rename (safe)
```text
[context block]
Work in ../la-memoria-next. Safe rename layer, no logic or GraphQL changes:
package.json name nestar-next → la-memoria-next; <title>/meta in LayoutBasic/LayoutHome/LayoutFull;
Footer copyright; "NESTAR ... MOBILE" placeholders; brand strings in public/locales/{en,kr,ru}/common.json.
Plan first. Verify with: grep -rni nestar (excluding node_modules/.next), npx tsc --noEmit, yarn build.
```

### 3.4 Frontend GraphQL and route migration
```text
[context block]
Backend Layer 2 is merged. Migrate ../la-memoria-next to the new schema following docs/FRONTEND_MIGRATION.md
§2 (pages/components) and §3 (GraphQL). Rename apollo documents, libs/types/property→package, enums, pages
/property→/package and /agent→/studio, and components. Update every router.push and menu link.
Plan first. Verify with tsc, yarn build, and a page-by-page smoke test against the local API.
```

### 3.5 Lint debt (formatting only)
```text
[context block]
Formatting-only change: run npx prettier --write "apps/**/*.ts" and nothing else.
Confirm tsc and builds still pass, and show lint counts before and after. No logic edits.
```

### 3.6 Status refresh of the docs
```text
[context block]
Update docs/COMPLETED_TASKS.md, docs/NEXT_STEPS.md, docs/BACKEND_MIGRATION.md (status table) and
docs/DECISIONS.md to reflect the work done since the last update. Use git log / git diff as the source of truth.
Do not change application source code.
```

### 3.7 Review before commit
```text
[context block]
Review the staged diff (git diff --cached -M) for: anything outside the layer's scope, leftover old terms,
broken imports, and GraphQL schema changes that weren't planned. Report findings only; do not edit or commit.
```
