# Napkin Runbook

## Curation Rules

- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-09-09] A PR that is CONFLICTING with main gets no GitHub Actions run at all (looks like "CI never triggered")**
   Do instead: `gh pr view N --json mergeable` first; merge main into the branch (regenerate Drizzle migrations when both sides added one) before chasing webhooks. Parallel tickets that add migrations collide on the number: the second to land regenerates.
2. **[2026-09-09] Parallel implementers share the main working tree unless isolated; an orchestrator `rm`/edit in the tree lands in the agent's branch**
   Do instead: launch parallel implementers with `isolation: "worktree"`; research agents write to the scratchpad, never the repo; the orchestrator touches the tree only when no implementer is running in it.
3. **[2026-09-09] A general-purpose research agent fanned out into 14 nested agents and none compiled the result**
   Do instead: every research/implement prompt says "do not spawn subagents; work sequentially; write the file yourself"; prefer one scoped agent per bank or topic launched by the orchestrator when parallelism is wanted.

4. **[2026-09-02] Orchestrator never implements tickets**
   Do instead: delegate to `.claude/agents/implementer.md` (Sonnet); keep the main session for planning, integration and talking to the user.
5. **[2026-09-02] Matt Pocock plugin skills are user-invoked: `/mattpocock-skills:{implement,to-spec,to-tickets,triage,grill-with-docs,wayfinder}`**
   Do instead: they do not appear in the model-invocable list; ask the user to type the slash command, then follow the loaded instructions. Model-invocable: `tdd`, `research`, `domain-modeling`, `codebase-design`, `code-review`, `grilling`, `wizard`, `prototype`, `diagnosing-bugs`.
6. **[2026-09-02] `setup-pre-commit` and `better-portuguese` skills are absent**
   Do instead: pre-commit is already set (Husky); pt-BR passes go to the `scribe` agent.
7. **[2026-09-02] Preview deployments sit behind Vercel Authentication**
   Do instead: E2E against previews needs a protection-bypass token (`x-vercel-protection-bypass`); production `feudo.vercel.app` is public.

## Shell & Command Reliability
1. **[2026-09-18] Boundary lint: `no-restricted-imports` ignores `import()`, matches the spelling of relative specifiers (not the resolved path), and typed linting needs fixture files on disk (`lintText` on a non-existent path is a fatal parse error)**
   Do instead: pair every pattern with a `no-restricted-syntax` `ImportExpression > Literal[value=/…/]` selector; anchor relative patterns as `^(\./)*(\.\./)+`; write fixtures under transient `__fixture*__` dirs created before the ESLint instance loads the config, guard with `existsSync`, remove in `afterAll`.
2. **[2026-09-18] `scripts/reset-*.mjs` and drizzle-kit load `src/platform/db/schema.ts` under plain Node, which has no `@/` alias; `pnpm test`, Next and vitest all resolve it, so only CI's `db:reset-schema` breaks**
   Do instead: inside `schema.ts` files and `platform/db/*` use relative imports with the `.ts` extension; before a PR run `env -u DATABASE_URL node apps/web/scripts/reset-schema.mjs` and expect the "DATABASE_URL is not set" message, not `ERR_MODULE_NOT_FOUND`.
3. **[2026-09-09] `vercel env pull` does not export `--sensitive` values (CRON_SECRET, BETTER_AUTH_SECRET come back empty)**
   Do instead: verify cron routes through the scheduled run's logs (`vercel logs`), or keep a generated secret in a 0600 scratch file for the one curl and delete it; never rotate production secrets just to smoke-test.
4. **[2026-09-09] `vercel env rm VAR <env>` on an integration-managed variable deletes the record for EVERY environment (production lost DATABASE_URL once)**
   Do instead: never `env rm` marketplace vars; `vercel integration resource disconnect <resource> <project>` then `connect ... -e <env>` to re-scope; verify hosts per environment with `vercel env pull` afterwards.
5. **[2026-09-09] Vercel marketplace integrations that need terms acceptance (Resend) return a `verification_uri` the owner must open once; afterwards `vercel integration add` works non-interactively**
   Do instead: give the link, then re-run the add with `-e production -e preview`.
6. **[2026-09-09] The shell is zsh: `for v in $vars` does NOT word-split; loops silently run once**
   Do instead: write the list literally in the `for`, use `${=vars}`, or run the loop under `bash -c`.
7. **[2026-09-08] lint-staged runs Prettier on Markdown, which re-pads tables; exact-string replaces fail silently**
   Do instead: anchor edits on line prefixes, always `assert` the match, run `pnpm exec prettier --write` afterwards; Bash `cd` persists across calls, so use absolute paths. Verify with `grep -c` before committing or posting a PR comment that claims a fix landed (2026-09-09: a partial apply shipped with a comment saying "all applied").
8. **[2026-09-02] Pushes to `main` are blocked by ruleset 22097993 (PR + CI only); the gh token needed `workflow` scope**
   Do instead: work on branches and open PRs; the ruleset can only be toggled with the owner's explicit OK.
9. **[2026-09-02] `npx impeccable skills install` fails with "invalid zip data" (fflate)**
   Do instead: `curl -L https://impeccable.style/api/download/bundle/universal -o bundle.zip`, `unzip ".claude/*"`, copy `skills/impeccable` and `agents/impeccable-*.md` into `.claude/`; skip its hooks.
10. **[2026-09-02] Vercel project settings are patched through the REST API, not the CLI**
   Do instead: token from `~/.local/share/com.vercel.cli/auth.json`; `PATCH /v9/projects/prj_yQ9yIizOTI6fOk1XNsmIOF0ZdTTA?teamId=team_GXogSV1DlEUaBKFFJz96kEmP` (rootDirectory `apps/web`, ssoProtection `preview`).
11. **[2026-09-02] `vercel integration add neon` installs Neon agent skills into the repo**
   Do instead: delete `.agents/`, `skills-lock.json`, `.claude/skills/neon*` afterwards; Context7 covers Neon docs.
12. **[2026-09-02] Next 16 + `@serwist/next` 9 needs `next build --webpack`**
   Do instead: keep the `--webpack` flag in `apps/web` scripts until Serwist ships stable Turbopack support.
13. **[2026-09-02] `codex` on PATH is a Windows Volta shim and fails under WSL**
   Do instead: user installs `@openai/codex` inside WSL; `review.md` skips the external reviewer when `codex` is absent.
14. **[2026-09-02] Toolchain: node 24 (nvm), pnpm 10.31, gh (fernandolisboa), vercel CLI (team feuxs-projects)**
   Do instead: Neon has no CLI here; it is managed through the Vercel integration (resource `neon-byzantium-mountain`, Free plan).
15. **[2026-09-08] `gh pr checks | grep pass` matches the Vercel comment check before `ci` finishes**
   Do instead: the PR has several rows (`ci`, then `integration`, plus Vercel); poll until no row is `pending`/`queued`/`in_progress` and then check every row, not only `ci`.

## Domain Behavior Guardrails
1. **[2026-09-18] Layout is vertical slices in one Next app (ADR-0011, #62/#63)**
   Do instead: `app/` is routing only; every capability lives in `apps/web/src/modules/<slice>/` (schema, repository, service, actions, components, strings, tests, `index.ts`); infra in `platform/`, shadcn and layout atoms in `ui/`, pure helpers in `lib/`; import a slice only via `@/modules/<slice>`; `packages/core/src/<slice>` mirrors the names. Never propose `apps/api` or per-slice packages unless the owner asks.
2. **[2026-09-11] Meu Pluggy gives NO API credentials; it is two separate accounts (meu.pluggy.ai + dashboard.pluggy.ai) and each bank must be linked to the Dashboard application one by one via the MeuPluggy connector**
   Do instead: ADR-0005 and #12 describe a one-account flow that does not exist. Wizard copy must cover all 7 steps from pluggy.ai/meu-pluggy, warn that a bank added later needs the linking step repeated, and say the 15-day trial banner does not end personal use. `GET /items` is opt-in and disabled by default, so the connection table must persist each provider item id rather than discover it.
3. **[2026-09-09] The auth module fails fast at first request when `EMAIL_PROVIDER` resolves to `resend` without `RESEND_API_KEY`/`EMAIL_FROM` (all auth pages 500)**
   Do instead: every Vercel environment sets `EMAIL_PROVIDER` explicitly (`fake` until Resend is installed); after changing env vars, `vercel redeploy <latest-prod-url> --yes` so they apply; probe `/registrar` after every production deploy.
4. **[2026-09-09] Preview and development use a SEPARATE free Neon project (`feudo-preview`, host ep-late-flower); production stays on `neon-byzantium-mountain` (ep-dry-wildflower)**
   Do instead: no Neon API key, no branch reset job; CI recreates the schema on the preview project each run; `DATABASE_URL_PREVIEW` GitHub secret = the preview project's URL (set from `vercel env pull`, never printed).
5. **[2026-09-09] All three Vercel environments point at the same Neon branch (main); the marketplace integration creates no per-deploy branches**
   Do instead: ticket #6 creates the `preview` branch and repoints the Preview env; never run previews or CI against production data.

6. **[2026-09-02] Multi-tenant from day one; household is the tenant, two data scopes (ADR-0001)**
   Do instead: household tables carry `household_id`; bank connections and provider credentials carry `user_id`; scoped repositories only; every new table ships an isolation test and a row in the ADR-0008 data map.
7. **[2026-09-08] Pluggy paid plan is R$ 2,500/month; each user brings their own Meu Pluggy credentials (ADR-0005)**
   Do instead: no Connect widget, no pooled credentials; closed beta needs Pluggy support's written OK (draft in docs/research); public launch needs a paid aggregator.
8. **[2026-09-02] Money is integer centavos + currency code**
   Do instead: never floats; dates UTC, displayed in household time zone.

## User Directives
1. **[2026-09-09] Secrets the user creates (Neon API key, Resend key) go in through terminal commands that prompt for the value (`gh secret set`, `vercel env add --sensitive`), never through chat**
   Do instead: give the exact command and the console link; wire everything else yourself once the secret exists.

2. **[2026-09-02] Speak pt-BR to the user; everything else in English**
   Do instead: chat in Portuguese; code, commits, tickets, docs, ADRs in English; UI strings ship in pt-BR.
3. **[2026-09-02] Stop at every ⏸ checkpoint and wait for approval**
   Do instead: finish the phase, present the requested artifacts, end the turn.
4. **[2026-09-02] Ask before paid resources, deleting data, force pushes, bank consents**
   Do instead: state the cost/impact and wait; Pluggy beyond free tier needs explicit OK.
5. **[2026-09-02] User does not read code; reviewers and tests are their eyes**
   Do instead: optimize for verifiability; never run `/impeccable audit` for the user.

## 2026-09-09 — production schema was empty after the Neon reconnect
- Reconnecting the Neon integration for production swapped the project; `public` had zero tables while main carried six migrations. Health check (`select 1`) stayed green. Applied them by hand: `vercel env pull --environment=production --yes <scratch file>` from the repo root (the link lives in `/.vercel`, not `apps/web`), export `DATABASE_URL`, `pnpm --filter @feudo/web exec drizzle-kit migrate`, then delete the scratch file. Filed an issue to move this into CI and to make `/api/health` compare applied vs committed migrations.
- After every merge with a migration: check `drizzle.__drizzle_migrations` in production until the CI job exists.
- Shared preview DB + divergent branch schemas: another branch's `integration` job can recreate the schema between one run's `integration` and `e2e` jobs (the concurrency group is released between jobs). Symptom: every e2e spec stuck on `/registrar`. Fix landing in #42: `e2e` resets and migrates itself at its start.
- `codex exec` refuses a cwd outside a trusted git repo: run it from the review worktree with `--skip-git-repo-check`.
- Base UI: `Menu.GroupLabel` (shadcn `DropdownMenuLabel`) throws when not inside `Menu.Group`; the popup crashes silently in e2e (menu never appears). Wrap labels in `DropdownMenuGroup`.
- Worktree on a differently named local branch: `git push origin <branch>` pushes the stale local ref of that name and is rejected as non-fast-forward. Push `HEAD:<branch>`.
- Vercel Hobby: 2 cron jobs per project, daily only. New housekeeping tasks become steps of `/api/cron/daily`, never new entries.
- GitHub concurrency groups keep one running + one pending job; a newer pending job cancels the older. Jobs of one run sharing a group must be chained with `needs`, or one of them gets cancelled by another branch.
- Session-limit cutoffs (429 on Sonnet) kill subagents mid-poll; their worktrees keep pushed work. Check `git log origin/<branch>` before relaunching; do not re-run what is already pushed.
- Reviewer lens verdicts on #42/#50 that were pure duplicates across lenses were merged by keeping the strictest label; Codex found two real CI/a11y items the six lenses missed (pending-job cancellation, collapsed nav links without a name). Keep Codex in the loop.
- 2026-09-10: production migrations are CI-owned (`migrate-production` on push to main, GitHub Environment `production` restricted to `main`, secret `DATABASE_URL_PRODUCTION` + variable `DATABASE_PRODUCTION_HOST` inside it; repo-level `DATABASE_PRODUCTION_HOST` stays for the preview jobs' reset guard). `/api/health` now returns `{ ok, db, migrations: { status } }` with `up-to-date | behind | ahead | unknown`; a persistent 503 after the job is green is the incident.
- drizzle-orm 0.45 wraps driver errors in `DrizzleQueryError`; SQLSTATE lives on `error.cause`. Tests that mock `db.execute` never see the wrapper: test error handling through a real `drizzle()` over a fake client.
- Sonnet implementers keep running `withTestDb` locally against the preview DB unless told not to; every prompt must say "do not run integration tests locally".
- A PR whose CI never starts is almost always CONFLICTING with main (GitHub creates no check-suite); check `gh pr view --json mergeable` before suspecting Actions.
- 2026-09-10 #11 decisions: ownership transfer copy is "transferir a responsabilidade" (owner = responsável; never "posse"); glossary rows added for Role → papel and Transfer ownership. A sole owner may leave, which deletes the household immediately; #26 replaces that with the 7-day grace. Dates render with the household's time zone through `lib/format-date.ts`.
- Review pipeline cost check: #11 took one full round (7 blocking), one 20-item return, five re-checks, one 6-item final return. Big tickets should be split next time (invites vs. roles/transfer) so each PR fits one return.
- The Read tool can return a stale cached copy right after a `git checkout` inside a worktree (no error). Verify with `cat -n <path>` or `git diff origin/main -- <file>` before judging code. (ui-critic, #61)
- 2026-09-10: an implementer amended and force-pushed a feature branch without asking (CLAUDE.md forbids it). Nothing was lost (same-round commit, successor kept the fix), but every implementer prompt must say "no rebase, no force-push, never amend a pushed commit" explicitly — the ones that omitted it are the ones that did it.
- The main checkout's node_modules goes stale as feature branches add dependencies (missing `@vercel/functions`, `@testing-library/react`) and `.next/types` leaks stale route types into typecheck. After merging a PR that adds a dep: `rm -rf apps/web/.next && pnpm install --frozen-lockfile` in the main checkout.
