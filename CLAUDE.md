# CLAUDE.md

Harness for **hcmus-physic-website** — Khoa Vật Lý CMS. pnpm monorepo, 3 workspaces:

- `backend` (dir `backend/`) — NestJS API, :3001. Prisma + PostgreSQL + Redis cache.
- `admin` (dir `frontend/`) — Next.js admin console, :3000.
- `public` (dir `frontend-public/`) — Next.js public site, :3002.

See `docs/architecture.md` for module topology and the post→layout→public publish flow.

## Startup Workflow

Before writing code:

1. **Confirm working directory** with `pwd`
2. **Read this file** completely
3. **Read project docs** — `docs/architecture.md` (system topology, NestJS modules, post→layout→public flow) and `docs/legacy-migration-plan.md`
4. **Run `./init.sh`** to verify environment is healthy
5. **Read `feature_list.json`** to see current feature state
6. **Review recent commits** with `git log --oneline -5`

If baseline verification is failing, repair that first before adding new scope.

## Working Rules

- **One feature at a time**: Pick exactly one unfinished feature from `feature_list.json`
- **Verification required**: Don't claim done without running verification commands
- **Update artifacts**: Before ending session, update `progress.md` and `feature_list.json`
- **Stay in scope**: Don't modify files unrelated to the current feature
- **Leave clean state**: Next session must be able to run `./init.sh` immediately

## Required Artifacts

- `feature_list.json` — Feature state tracker (source of truth)
- `progress.md` — Session continuity log
- `init.sh` — Standard startup and verification path
- `session-handoff.md` — Optional, for larger sessions

## Definition of Done

A feature is done only when ALL of the following are true:

- [ ] Target behavior is implemented
- [ ] Required verification actually ran (tests / lint / type-check)
- [ ] Evidence recorded in `feature_list.json` or `progress.md`
- [ ] Repository remains restartable from standard startup path

## End of Session

Before ending a session:

1. Update `progress.md` with current state
2. Update `feature_list.json` with new feature status
3. Record any unresolved risks or blockers
4. Commit with descriptive message once work is in safe state
5. Leave repo clean enough for next session to run `./init.sh` immediately

## Verification Commands

```bash
# Full verification (recommended)
./init.sh
```

Required checks:
- `pnpm install`
- `pnpm run lint`
- `pnpm test`
- `pnpm run build`

## Escalation

If you encounter:
- **Architecture decisions**: Consult `docs/architecture.md`, otherwise ask user
- **Unclear requirements**: Check `docs/legacy-migration-plan.md`, otherwise ask user
- **Repeated test failures**: Update progress, flag for human review
- **Scope ambiguity**: Re-read `feature_list.json` for definition of done
