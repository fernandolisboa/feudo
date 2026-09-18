# Napkin Runbook

## Curation Rules

- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-09-09] Parallel implementers share the main working tree unless isolated; an orchestrator `rm`/edit in the tree lands in the agent's branch**
   Do instead: launch parallel implementers with `isolation: "worktree"`; research agents write to the scratchpad, never the repo; the orchestrator touches the tree only when no implementer is running in it.
2. **[2026-09-09] A general-purpose research agent fanned out into 14 nested agents and none compiled the result**
   Do instead: every research/implement prompt says "do not spawn subagents; work sequentially; write the file yourself"; prefer one scoped agent per bank or topic launched by the orchestrator when parallelism is wanted.

3. **[2026-09-02] Orchestrator never implements tickets**
   Do instead: delegate to `.claude/agents/implementer.md` (Sonnet); keep the main session for planning, integration and talking to the user.
4. **[2026-09-02] Matt Pocock plugin skills are user-invoked: `/mattpocock-skills:{implement,to-spec,to-tickets,triage,grill-with-docs,wayfinder}`**
   Do instead: they do not appear in the model-invocable list; ask the user to type the slash command, then follow the loaded instructions. Model-invocable: `tdd`, `research`, `domain-modeling`, `codebase-design`, `code-review`, `grilling`, `wizard`, `prototype`, `diagnosing-bugs`.
5. **[2026-09-02] `setup-pre-commit` and `better-portuguese` skills are absent**
   Do instead: pre-commit is already set (Husky); pt-BR passes go to the `scribe` agent.
6. **[2026-09-02] Preview deployments sit behind Vercel Authentication**
   Do instead: E2E against previews needs a protection-bypass token (`x-vercel-protection-bypass`); production `feudo.vercel.app` is public.

## Shell & Command Reliability
1. **[2026-09-18] Boundary lint: `no-restricted-imports` ignores `import()`, matches the spelling of relative specifiers (not the resolved path), and typed linting needs fixture files on disk (`lintText` on a non-existent path is a fatal parse error)**
   Do instead: pair every pattern with a `no-restricted-syntax` `ImportExpression > Literal[value=/…/]` selector; anchor relative patterns as `^(\./)*(\.\./)+`; write fixtures under transient `__fixture*__` dirs created before the ESLint instance loads the config, guard with `existsSync`, remove in `afterAll`.
1. **[2026-09-18] `scripts/reset-*.mjs` and drizzle-kit load `src/platform/db/schema.ts` under plain Node, which has no `@/` alias; `pnpm test`, Next and vitest all resolve it, so only CI's `db:reset-schema` breaks**
   Do instead: inside `schema.ts` files and `platform/db/*` use relative imports with the `.ts` extension; before a PR run `env -u DATABASE_URL node apps/web/scripts/reset-schema.mjs` and expect the "DATABASE_URL is not set" message, not `ERR_MODULE_NOT_FOUND`.
1. **[2026-09-09] `vercel env rm VAR <env>` on an integration-managed variable deletes the record for EVERY environment (production lost DATABASE_URL once)**
   Do instead: never `env rm` marketplace vars; `vercel integration resource disconnect <resource> <project>` then `connect ... -e <env>` to re-scope; verify hosts per environment with `vercel env pull` afterwards.
2. **[2026-09-09] Vercel marketplace integrations that need terms acceptance (Resend) return a `verification_uri` the owner must open once; afterwards `vercel integration add` works non-interactively**
   Do instead: give the link, then re-run the add with `-e production -e preview`.
3. **[2026-09-09] The shell is zsh: `for v in $vars` does NOT word-split; loops silently run once**
   Do instead: write the list literally in the `for`, use `${=vars}`, or run the loop under `bash -c`.
4. **[2026-09-08] lint-staged runs Prettier on Markdown, which re-pads tables; exact-string replaces fail silently**
   Do instead: anchor edits on line prefixes, always `assert` the match, run `pnpm exec prettier --write` afterwards; Bash `cd` persists across calls, so use absolute paths. Verify with `grep -c` before committing or posting a PR comment that claims a fix landed (2026-09-09: a partial apply shipped with a comment saying "all applied").
5. **[2026-09-02] Pushes to `main` are blocked by ruleset 22097993 (PR + CI only); the gh token needed `workflow` scope**
   Do instead: work on branches and open PRs; the ruleset can only be toggled with the owner's explicit OK.
6. **[2026-09-02] `npx impeccable skills install` fails with "invalid zip data" (fflate)**
   Do instead: `curl -L https://impeccable.style/api/download/bundle/universal -o bundle.zip`, `unzip ".claude/*"`, copy `skills/impeccable` and `agents/impeccable-*.md` into `.claude/`; skip its hooks.
7. **[2026-09-02] Vercel project settings are patched through the REST API, not the CLI**
   Do instead: token from `~/.local/share/com.vercel.cli/auth.json`; `PATCH /v9/projects/prj_yQ9yIizOTI6fOk1XNsmIOF0ZdTTA?teamId=team_GXogSV1DlEUaBKFFJz96kEmP` (rootDirectory `apps/web`, ssoProtection `preview`).
8. **[2026-09-02] `vercel integration add neon` installs Neon agent skills into the repo**
   Do instead: delete `.agents/`, `skills-lock.json`, `.claude/skills/neon*` afterwards; Context7 covers Neon docs.
9. **[2026-09-02] Next 16 + `@serwist/next` 9 needs `next build --webpack`**
   Do instead: keep the `--webpack` flag in `apps/web` scripts until Serwist ships stable Turbopack support.
10. **[2026-09-02] `codex` on PATH is a Windows Volta shim and fails under WSL**
   Do instead: user installs `@openai/codex` inside WSL; `review.md` skips the external reviewer when `codex` is absent.
11. **[2026-09-02] Toolchain: node 24 (nvm), pnpm 10.31, gh (fernandolisboa), vercel CLI (team feuxs-projects)**
   Do instead: Neon has no CLI here; it is managed through the Vercel integration (resource `neon-byzantium-mountain`, Free plan).
12. **[2026-09-08] `gh pr checks | grep pass` matches the Vercel comment check before `ci` finishes**
   Do instead: the PR has several rows (`ci`, then `integration`, plus Vercel); poll until no row is `pending`/`queued`/`in_progress` and then check every row, not only `ci`.

## Domain Behavior Guardrails
1. **[2026-09-18] Layout is vertical slices in one Next app (ADR-0011, #62/#63)**
   Do instead: `app/` is routing only; every capability lives in `apps/web/src/modules/<slice>/` (schema, repository, service, actions, components, strings, tests, `index.ts`); infra in `platform/`, shadcn and layout atoms in `ui/`, pure helpers in `lib/`; import a slice only via `@/modules/<slice>`; `packages/core/src/<slice>` mirrors the names. Never propose `apps/api` or per-slice packages unless the owner asks.
1. **[2026-09-09] Preview and development use a SEPARATE free Neon project (`feudo-preview`, host ep-late-flower); production stays on `neon-byzantium-mountain` (ep-dry-wildflower)**
   Do instead: no Neon API key, no branch reset job; CI recreates the schema on the preview project each run; `DATABASE_URL_PREVIEW` GitHub secret = the preview project's URL (set from `vercel env pull`, never printed).
2. **[2026-09-09] All three Vercel environments point at the same Neon branch (main); the marketplace integration creates no per-deploy branches**
   Do instead: ticket #6 creates the `preview` branch and repoints the Preview env; never run previews or CI against production data.

3. **[2026-09-02] Multi-tenant from day one; household is the tenant, two data scopes (ADR-0001)**
   Do instead: household tables carry `household_id`; bank connections and provider credentials carry `user_id`; scoped repositories only; every new table ships an isolation test and a row in the ADR-0008 data map.
4. **[2026-09-08] Pluggy paid plan is R$ 2,500/month; each user brings their own Meu Pluggy credentials (ADR-0005)**
   Do instead: no Connect widget, no pooled credentials; closed beta needs Pluggy support's written OK (draft in docs/research); public launch needs a paid aggregator.
5. **[2026-09-02] Money is integer centavos + currency code**
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
