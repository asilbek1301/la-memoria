# La Memoria Backend Agent Instruction

La Memoria is a NestJS GraphQL monorepo migrated from Real estate platform into a wedding (photoshoot) studio platform

## Read First

Before changing code, read the current AI handoff docs:

- `docs/BACKEND_MIGRATION.md`
- `docs/DECISIONS.md`
- `docs/COMPLETED_TASKS.md`
- `docs/NEXT_STEPS.md`

Use those files as the source of truth for AI Agent related migration history, accepted decisions, remaining work and validation status.

## Project Shape

- Backend apps are `la-memoria-api` and `la-memoria-batch`.
- Keep the existing NestJS resolver/service/module pattern based on MVC and DI.
- Keep DTOs, enums, schemas under `apps/la-memoria-api/src/libs`.
  Keep shared modules reusable: auth, member, like, view, comment, follow, board article, socket.

## Domain Rules

- Use La Memoria/package terminology for the main catalog entity.
- Do not reintroduce property or real-estate fields.
- Keep `MemberType.USER`, `MemberType.ADMIN` unchanged.
- Package ownership continues to use `MemberType.STUDIO` unless a later migration explicity changes it.
- Package enum values are:
  - `PackageType`: `PEARL`, `GOLD`, `DIAMOND`
  - `packageStatus`: `HOLD` `ACTIVE` `PAUSE` `DELETE`
  - `PackageStyle`: `CLASSIC`, `MODERN`, `VINTAGE`, `ROMANTIC`
  - `PackageLocation`: `SEOUL`, `BUSAN`, `INCHEON`, `DAEGU`, `GYEONGJU`, `GWANGJU`, `CHONJU`, `DAEJON`, `JEJU`

## Workflow

1. Anylyze before editing.
2. Keep changes small and consistant with existing project patterns.
3. Do not remove working logic unless it is replaced safely.
4. Update `docs/ai/COMPLETED_TASKS.md` after major completed work.
5. Add or update focused tests when behaivior changes.

## Validation

Use these checks for backend work:

```bash
npx tsc -p apps/la-memoria-api/tsconfig.app.json --noEmit
npx tsc -p apps/la-memoria-batch/tsconfig.app.json --noEmit
npx run build
```

`npm run lint` runs ESLint with `--fix`, so use it only when file rewriting is acceptable!
