---
name: backend-migration
description: Continue the La Memoria backend migration from Nestar property concepts to La Memoria package concepts while preserving the existing NestJS architecture.
---

# La Memoria Backend Migration

Use this skill when changing backend code for the La Memoria package migration.

## Workflow

1. Search for affected property/package references before editing.
2. Preserve the resolver/service/module structure already used by `la-memoria-api`.
3. Keep DTOs, enums, and schemas in their existing folders.
4. Keep `MemberType.USER | STUDIO | ADMIN` unchanged.
5. Use package terminology for catalog behavior and database lookups.
6. Update social modules consistently when package counters, likes, views, comments, or notifications are involved.
7. Update batch logic when package ranking or `memberPackages` affects rank calculations.
8. Update `docs/ai/COMPLETED_TASKS.md` afetr major completed work.
