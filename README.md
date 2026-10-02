# La Memoria Backend

NestJS GraphQL monorepo for La Memoria, a wedding photoshoot studio platform.

## Apps

| App | Path | Description |
| --- | --- | --- |
| `la-memoria-api` | `apps/la-memoria-api` | GraphQL API (Apollo), MongoDB, WebSocket chat |
| `la-memoria-batch` | `apps/la-memoria-batch` | Scheduled batch jobs (ranking, rollback) |

## Environment

Create a `.env` file in the project root:

```
PORT_API=
PORT_BATCH=
MONGO_DEV=
MONGO_PROD=
SECRET_TOKEN=
```

## Scripts

```bash
npm install

# API
npm run start:dev
npm run build
npm run start:prod

# Batch
npm run start:dev:batch
npm run build:batch
npm run start:prod:batch

# Quality
npm run lint
npm run test
npm run test:e2e
```
