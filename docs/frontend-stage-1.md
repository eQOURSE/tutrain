# Stage 1 frontend handoff

## Surface boundaries

| Surface | v2 entry point | Responsibility during migration |
| --- | --- | --- |
| Public site | `apps/web` | Marketing pages and catalogue discovery. Legacy remains the source for live plans and checkout until those flows cut over. |
| Learning portal | `apps/app` | Guardian, learner and tutor views. Legacy continues serving live accounts, sessions and learning records until each v2 flow is ready. |
| Staff console | `apps/admin` | Staff views based on server permissions. Legacy continues serving real operations. v2 role fixtures cover UI presentation only. |

## B02 review

Install with `pnpm install --frozen-lockfile`. Use `pnpm dev:web`, `pnpm dev:app`, and `pnpm dev:admin` for ports 4100, 4101, and 4102.

Set `TUTRAIN_MOCK_API=1` and set `TUTRAIN_MOCK_ROLE` to `guardian`, `learner`, `tutor`, `operations`, or `super_admin` before starting the relevant app. Restart the server when switching roles. Production builds disable mock sessions. Protected routes send signed out users to login.

The frontend package and its synthetic fixtures run independently for review. Once A03 lands, reconcile root workspace configuration and use the shared fixtures under `packages/contracts`.

## B01 release checks

- Confirm the stale token fix is present in the target deployment before releasing backend A01 Part 2.
- Verify the already paid checkout message and pending payment page on staging. Promote legacy frontend PRs #110 and #112 to production before releasing backend #16.
- Review legacy PRs #108 and #109 for deployment smoke checks and image origins. Review #113 and #114 for PR checks and staging action pins.
