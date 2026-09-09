# Napkin Runbook

## Curation Rules

- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)

1. **[2026-09-02] Orchestrator never implements tickets**
   Do instead: delegate to `.claude/agents/implementer.md` (Sonnet); keep the main session for planning, integration and talking to the user.
2. **[2026-09-02] Matt Pocock plugin skills are user-invoked: `/mattpocock-skills:{implement,to-spec,to-tickets,triage,grill-with-docs,wayfinder}`**
   Do instead: they do not appear in the model-invocable list; ask the user to type the slash command, then follow the loaded instructions. Model-invocable: `tdd`, `research`, `domain-modeling`, `codebase-design`, `code-review`, `grilling`, `wizard`, `prototype`, `diagnosing-bugs`.
3. **[2026-09-02] `setup-pre-commit` and `better-portuguese` skills are absent**
   Do instead: pre-commit is already set (Husky); pt-BR passes go to the `scribe` agent.
4. **[2026-09-02] Preview deployments sit behind Vercel Authentication**
   Do instead: E2E against previews needs a protection-bypass token (`x-vercel-protection-bypass`); production `feudo.vercel.app` is public.

## Shell & Command Reliability
1. **[2026-09-08] lint-staged runs Prettier on Markdown, which re-pads tables; exact-string replaces fail silently**
   Do instead: anchor edits on line prefixes, always `assert` the match, run `pnpm exec prettier --write` afterwards; Bash `cd` persists across calls, so use absolute paths. Verify with `grep -c` before committing or posting a PR comment that claims a fix landed (2026-09-09: a partial apply shipped with a comment saying "all applied").
2. **[2026-09-02] Pushes to `main` are blocked by ruleset 22097993 (PR + CI only); the gh token needed `workflow` scope**
   Do instead: work on branches and open PRs; the ruleset can only be toggled with the owner's explicit OK.
3. **[2026-09-02] `npx impeccable skills install` fails with "invalid zip data" (fflate)**
   Do instead: `curl -L https://impeccable.style/api/download/bundle/universal -o bundle.zip`, `unzip ".claude/*"`, copy `skills/impeccable` and `agents/impeccable-*.md` into `.claude/`; skip its hooks.
4. **[2026-09-02] Vercel project settings are patched through the REST API, not the CLI**
   Do instead: token from `~/.local/share/com.vercel.cli/auth.json`; `PATCH /v9/projects/prj_yQ9yIizOTI6fOk1XNsmIOF0ZdTTA?teamId=team_GXogSV1DlEUaBKFFJz96kEmP` (rootDirectory `apps/web`, ssoProtection `preview`).
5. **[2026-09-02] `vercel integration add neon` installs Neon agent skills into the repo**
   Do instead: delete `.agents/`, `skills-lock.json`, `.claude/skills/neon*` afterwards; Context7 covers Neon docs.
6. **[2026-09-02] Next 16 + `@serwist/next` 9 needs `next build --webpack`**
   Do instead: keep the `--webpack` flag in `apps/web` scripts until Serwist ships stable Turbopack support.
7. **[2026-09-02] `codex` on PATH is a Windows Volta shim and fails under WSL**
   Do instead: user installs `@openai/codex` inside WSL; `review.md` skips the external reviewer when `codex` is absent.
8. **[2026-09-02] Toolchain: node 24 (nvm), pnpm 10.31, gh (fernandolisboa), vercel CLI (team feuxs-projects)**
   Do instead: Neon has no CLI here; it is managed through the Vercel integration (resource `neon-byzantium-mountain`, Free plan).
9. **[2026-09-08] `gh pr checks | grep pass` matches the Vercel comment check before `ci` finishes**
   Do instead: filter the `ci` row (`grep -E "^ci\s"`) before testing pass/fail.

## Domain Behavior Guardrails

1. **[2026-09-02] Multi-tenant from day one; household is the tenant, two data scopes (ADR-0001)**
   Do instead: household tables carry `household_id`; bank connections and provider credentials carry `user_id`; scoped repositories only; every new table ships an isolation test and a row in the ADR-0008 data map.
3. **[2026-09-08] Pluggy paid plan is R$ 2,500/month; each user brings their own Meu Pluggy credentials (ADR-0005)**
   Do instead: no Connect widget, no pooled credentials; closed beta needs Pluggy support's written OK (draft in docs/research); public launch needs a paid aggregator.
2. **[2026-09-02] Money is integer centavos + currency code**
   Do instead: never floats; dates UTC, displayed in household time zone.

## User Directives

1. **[2026-09-02] Speak pt-BR to the user; everything else in English**
   Do instead: chat in Portuguese; code, commits, tickets, docs, ADRs in English; UI strings ship in pt-BR.
2. **[2026-09-02] Stop at every ⏸ checkpoint and wait for approval**
   Do instead: finish the phase, present the requested artifacts, end the turn.
3. **[2026-09-02] Ask before paid resources, deleting data, force pushes, bank consents**
   Do instead: state the cost/impact and wait; Pluggy beyond free tier needs explicit OK.
4. **[2026-09-02] User does not read code; reviewers and tests are their eyes**
   Do instead: optimize for verifiability; never run `/impeccable audit` for the user.
