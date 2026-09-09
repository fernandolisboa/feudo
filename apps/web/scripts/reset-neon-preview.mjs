const NEON_API_BASE = "https://console.neon.tech/api/v2";
const PREVIEW_BRANCH_NAME = "preview";
const PARENT_BRANCH_NAME = "main";
const TERMINAL_OPERATION_STATUSES = new Set(["finished", "failed", "cancelled", "skipped"]);
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function missingSecrets(apiKey, projectId) {
  const missing = [];
  if (!apiKey) missing.push("NEON_API_KEY");
  if (!projectId) missing.push("NEON_PROJECT_ID");
  return missing;
}

async function neonRequest(apiKey, path, init) {
  const response = await fetch(`${NEON_API_BASE}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Neon API request to ${path} failed with status ${response.status}`);
  }

  return response.json();
}

function assertBranchListShape(payload) {
  if (!payload || !Array.isArray(payload.branches)) {
    throw new Error("Unexpected response shape from the Neon branches list endpoint.");
  }
  for (const branch of payload.branches) {
    if (typeof branch?.id !== "string" || typeof branch?.name !== "string") {
      throw new Error("Unexpected branch shape in the Neon API response.");
    }
  }
  return payload.branches;
}

function assertOperationsShape(payload) {
  if (!payload || !Array.isArray(payload.operations)) {
    throw new Error("Unexpected response shape from the Neon restore endpoint.");
  }
  for (const operation of payload.operations) {
    if (typeof operation?.id !== "string") {
      throw new Error("Unexpected operation shape in the Neon API response.");
    }
  }
  return payload.operations;
}

function assertOperationShape(payload) {
  const operation = payload?.operation;
  if (!operation || typeof operation.status !== "string") {
    throw new Error("Unexpected response shape from the Neon operation endpoint.");
  }
  return operation;
}

async function findBranchesByName(apiKey, projectId, name) {
  const payload = await neonRequest(
    apiKey,
    `/projects/${projectId}/branches?search=${encodeURIComponent(name)}`,
  );
  return assertBranchListShape(payload).filter((branch) => branch.name === name);
}

async function requireSingleBranch(apiKey, projectId, name) {
  const branches = await findBranchesByName(apiKey, projectId, name);
  if (branches.length === 0) {
    throw new Error(`Branch "${name}" was not found; it must already exist.`);
  }
  if (branches.length > 1) {
    throw new Error(`Found ${branches.length} branches named "${name}"; expected exactly one.`);
  }
  return branches[0];
}

async function waitForOperation(apiKey, projectId, operationId) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  for (;;) {
    const payload = await neonRequest(apiKey, `/projects/${projectId}/operations/${operationId}`);
    const operation = assertOperationShape(payload);

    if (operation.status === "finished") {
      return;
    }
    if (TERMINAL_OPERATION_STATUSES.has(operation.status)) {
      throw new Error(`Neon operation "${operationId}" ended with status "${operation.status}".`);
    }
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for Neon operation "${operationId}" to finish.`);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

async function main() {
  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;

  const missing = missingSecrets(apiKey, projectId);
  if (missing.length > 0) {
    console.log(`Skipping Neon preview branch reset: missing ${missing.join(", ")}.`);
    return;
  }

  const parentBranch = await requireSingleBranch(apiKey, projectId, PARENT_BRANCH_NAME);
  const previewBranch = await requireSingleBranch(apiKey, projectId, PREVIEW_BRANCH_NAME);

  const restorePayload = await neonRequest(
    apiKey,
    `/projects/${projectId}/branches/${previewBranch.id}/restore`,
    {
      method: "POST",
      body: JSON.stringify({ source_branch_id: parentBranch.id }),
    },
  );
  const operations = assertOperationsShape(restorePayload);

  for (const operation of operations) {
    await waitForOperation(apiKey, projectId, operation.id);
  }

  console.log(`Reset branch "${PREVIEW_BRANCH_NAME}" from "${PARENT_BRANCH_NAME}".`);
}

main().catch((error) => {
  console.error("Neon preview branch reset failed.");
  console.error(error instanceof Error ? error.message : "Unknown error.");
  process.exit(1);
});
