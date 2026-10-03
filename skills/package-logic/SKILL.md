---
name: package-logic
description: Review La Memoria package API consistency across GraphQL operations, DTOs, schemas, enums, filters, and remaining legacy terminology.
---

# La Memoria Package API Review

Use this skill for review-only passes or pre-edit analysis of the package API.

## Review Checklist

- Confirm GraphQL operation names use package terminology:
  - `createPackage`
  - `getPackage`
  - and where it is related
- Confirm shared operations such as `getFavorites` and `getVisited` return package data.
- Confirm DTOs, schemas, and enums agree on package fields and nullability.
- Confirm filters use package type, species, price and etc.
- Report real findings with paths and behavior impact.
