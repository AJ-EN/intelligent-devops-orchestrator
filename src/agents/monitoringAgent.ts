import {
  getFailedRuns,
  type WorkflowRun,
} from "../tools/githubTools";

export async function runMonitoringAgent(
  owner: string,
  repo: string,
): Promise<WorkflowRun | null> {
  const failedRuns = await getFailedRuns(owner, repo);

  if (failedRuns.length === 0) {
    console.log("✅ No failures detected");
    return null;
  }

  for (const run of failedRuns) {
    console.log(
      `Failure detected: ${run.name} | ${run.conclusion ?? "unknown"} | ${run.head_commit_message}`,
    );
  }

  return failedRuns[0] ?? null;
}
