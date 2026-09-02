# Napkin Runbook

## Curation Rules

- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)

1. **[2026-09-02] Orchestrator never implements tickets**
   Do instead: delegate to `.claude/agents/implementer.md` (Sonnet); keep the main session for planning, integration and talking to the user.
2. **[2026-09-02] Some claude.ai skills are user-only (`disable-model-invocation`)**
   Do instead: `setup-matt-pocock-skills` and similar must be run by the user; ask at the next checkpoint instead of replicating their workflow.

## Shell & Command Reliability

1. **[2026-09-02] `codex` on PATH is a Windows Volta shim and fails under WSL**
   Do instead: treat the external Codex reviewer as skipped until `@openai/codex` is installed inside WSL; `review.md` must degrade gracefully.
2. **[2026-09-02] Toolchain present: node 24 (nvm), pnpm 10, gh (fernandolisboa), vercel CLI (logged in)**
   Do instead: no Neon CLI installed; Neon goes through the Vercel integration.

## Domain Behavior Guardrails

1. **[2026-09-02] Multi-tenant from day one; household is the tenant**
   Do instead: every domain table carries `household_id`, every query goes through household-scoped repositories, every new table ships an isolation test.
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
