# `@tutrain/api`

Only `pnpm dev` reads these local variables from `apps/api/.env`. The file is ignored and must never contain production credentials. Staging and production servers receive their variables from the process environment:

```dotenv
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

`NODE_ENV` and `PORT` are required. `LOG_LEVEL` defaults to `info`.
