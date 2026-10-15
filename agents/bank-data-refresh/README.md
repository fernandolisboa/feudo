# Bank data refresh agent (Claude Managed Agents)

Runs `docs/runbooks/bank-data-refresh.md` as a Claude Managed Agents session on the owner's API
credits instead of a Claude plan routine. It opens one PR that changes only
`apps/web/src/modules/banking-intel/bank-profiles-data.ts`; it never merges. Review and merge stay
with the repository's normal PR flow.

## What lives where

- `agent.md`, `environment.yaml`, `vault.yaml` are definitions. `ant apply` creates them on
  Anthropic's side and records their IDs in `/claude-lock.json` (commit it with them).
- No secret is in these files. The GitHub token (env `FEUDO_AGENT_GITHUB_TOKEN`, a fine-grained PAT
  limited to this repository) goes to two places at run time: the vault, for the GitHub MCP server
  that opens the PR, and the session's `github_repository` resource, for clone and push. Neither
  reaches the sandbox; Anthropic's proxies inject it.
- The PAT needs only Contents (read and write), Pull requests (read and write) and Metadata (read)
  on this repository; never Workflows. CI fails a `claude/bank-data-refresh-*` PR that changes any
  other file before a job with secrets runs.
- `environment.yaml` and the web tools in `agent.md` allow only the sites the profiles already cite
  (plus GitHub). A new source on another site needs its domain added to both lists.
- Each session carries a hard budget (`max_list_cost`), so a run cannot spend beyond it.

## Commands

`ant` reads `ANTHROPIC_API_KEY`; the cloud environment provides it as `ANT_APIKEY`.

```sh
export ANTHROPIC_API_KEY="$ANT_APIKEY"; unset ANTHROPIC_BASE_URL
ant auth status                                   # confirm organization and workspace

# 1. Definitions
ant apply --dry-run -v agents/bank-data-refresh/agent.md agents/bank-data-refresh/environment.yaml agents/bank-data-refresh/vault.yaml
ant apply --yes agents/bank-data-refresh/agent.md agents/bank-data-refresh/environment.yaml agents/bank-data-refresh/vault.yaml

# 2. GitHub credential for the MCP server (once; reads the token from the environment)
VAULT_ID=$(jq -r '.resources["./agents/bank-data-refresh/vault.yaml"].id' claude-lock.json)
jq -n '{display_name: "GitHub (feudo)", auth: {type: "static_bearer",
  mcp_server_url: "https://api.githubcopilot.com/mcp/",
  token: (env.FEUDO_AGENT_GITHUB_TOKEN // error("FEUDO_AGENT_GITHUB_TOKEN is not set"))}}' \
  | ant beta:vaults:credentials create --vault-id "$VAULT_ID"

# 3. One run (budget in US cents)
AGENT_ID=$(jq -r '.resources["./agents/bank-data-refresh/agent.md"].id' claude-lock.json)
ENV_ID=$(jq -r '.resources["./agents/bank-data-refresh/environment.yaml"].id' claude-lock.json)
jq -n --arg agent "$AGENT_ID" --arg env "$ENV_ID" --arg vault "$VAULT_ID" '{
  agent: $agent, environment_id: $env, vault_ids: [$vault],
  title: "Bank data refresh",
  budget: {type: "limit", max_list_cost: {amount: "2000", currency: "USD"}},
  resources: [{type: "github_repository", url: "https://github.com/fernandolisboa/feudo",
    mount_path: "/workspace/feudo",
    authorization_token: (env.FEUDO_AGENT_GITHUB_TOKEN // error("FEUDO_AGENT_GITHUB_TOKEN is not set"))}]
}' | ant beta:sessions create --transform id -r > /var/tmp/bank-refresh-session
ant beta:sessions:events send --session-id "$(cat /var/tmp/bank-refresh-session)" < agents/bank-data-refresh/kickoff.yaml
ant beta:sessions retrieve --session-id "$(cat /var/tmp/bank-refresh-session)"   # status, usage.list_cost
```

A monthly schedule is a deployment with the same body plus `schedule` and `initial_events`; it is
created only after a test run is accepted, and paused or archived with
`ant beta:deployments pause|archive --deployment-id <depl_...>`.
