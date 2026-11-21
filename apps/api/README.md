# `@tutrain/api`

The API reads these local variables from `apps/api/.env` during development. The file is ignored and must never contain production credentials:

```dotenv
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

`NODE_ENV` and `PORT` are required. `LOG_LEVEL` defaults to `info`.
