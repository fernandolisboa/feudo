const NEON_API_BASE = "https://console.neon.tech/api/v2";
const PREVIEW_BRANCH_NAME = "preview";
const PARENT_BRANCH_NAME = "main";

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

async function findBranchByName(apiKey, projectId, name) {
  const { branches } = await neonRequest(
    apiKey,
    `/projects/${projectId}/branches?search=${encodeURIComponent(name)}`,
  );
  return branches.find((branch) => branch.name === name);
}

async function main() {
  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;

  const missing = missingSecrets(apiKey, projectId);
  if (missing.length > 0) {
    console.log(`Skipping Neon preview branch reset: missing ${missing.join(", ")}.`);
    return;
  }

  const parentBranch = await findBranchByName(apiKey, projectId, PARENT_BRANCH_NAME);
  if (!parentBranch) {
    throw new Error(`Parent branch "${PARENT_BRANCH_NAME}" not found.`);
  }

  const previewBranch = await findBranchByName(apiKey, projectId, PREVIEW_BRANCH_NAME);

  if (previewBranch) {
    await neonRequest(apiKey, `/projects/${projectId}/branches/${previewBranch.id}/restore`, {
      method: "POST",
      body: JSON.stringify({ source_branch_id: parentBranch.id }),
    });
    console.log(`Reset branch "${PREVIEW_BRANCH_NAME}" from "${PARENT_BRANCH_NAME}".`);
    return;
  }

  await neonRequest(apiKey, `/projects/${projectId}/branches`, {
    method: "POST",
    body: JSON.stringify({
      branch: { parent_id: parentBranch.id, name: PREVIEW_BRANCH_NAME },
      endpoints: [{ type: "read_write" }],
    }),
  });
  console.log(`Created branch "${PREVIEW_BRANCH_NAME}" from "${PARENT_BRANCH_NAME}".`);
}

main().catch((error) => {
  console.error("Neon preview branch reset failed.");
  console.error(error instanceof Error ? error.message : "Unknown error.");
  process.exit(1);
});
