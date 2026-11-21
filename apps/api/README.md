# `@tutrain/api`

Only `pnpm dev` reads these local variables from `apps/api/.env`. The file is ignored and must never contain production credentials. Staging and production servers receive their variables from the process environment:

```dotenv
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
DATABASE_URL=postgres://tutrain:tutrain@127.0.0.1:5432/tutrain
```

`NODE_ENV`, `PORT` and `DATABASE_URL` are required. `DATABASE_URL` must be a `postgres://` or `postgresql://` URL. `LOG_LEVEL` defaults to `info`.
