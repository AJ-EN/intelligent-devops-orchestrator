import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

import type { WorkflowRun } from "../tools/githubTools";

export interface MonitoringAgentResult {
  run: WorkflowRun | null;
  logs: string;
}

function parseJSON<T>(value: string): T {
  return JSON.parse(value) as T;
}

function getTextContent(result: unknown): string {
  if (
    typeof result !== "object" ||
    result === null ||
    !("content" in result) ||
    !Array.isArray(result.content)
  ) {
    return "";
  }

  return result.content
    .flatMap((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "text" &&
        "text" in item &&
        typeof item.text === "string"
      ) {
        return [item.text];
      }

      return [];
    })
    .join("\n")
    .trim();
}

export async function runMonitoringAgent(
  mcpClient: Client,
  owner: string,
  repo: string,
): Promise<MonitoringAgentResult> {
  try {
    const failedRunsResult = await mcpClient.callTool({
      name: "list_failed_runs",
      arguments: {
        owner,
        repo,
      },
    });

    const failedRunsText =
      failedRunsResult.isError === true ? "" : getTextContent(failedRunsResult);
    const failedRuns =
      failedRunsText.length > 0 ? parseJSON<WorkflowRun[]>(failedRunsText) : [];

    if (failedRuns.length === 0) {
      console.log("✅ No failures detected");
      return { run: null, logs: "" };
    }

    for (const run of failedRuns) {
      console.log(
        `Failure detected: ${run.name} | ${run.conclusion ?? "unknown"} | ${run.head_commit_message}`,
      );
    }

    const mostRecentRun = failedRuns[0];
    if (!mostRecentRun) {
      return { run: null, logs: "" };
    }

    const logsResult = await mcpClient.callTool({
      name: "get_run_logs",
      arguments: {
        owner,
        repo,
        runId: mostRecentRun.id,
      },
    });

    const logsText = logsResult.isError === true ? "" : getTextContent(logsResult);
    const logs = logsText.length > 0 ? parseJSON<string>(logsText) : "Logs unavailable";

    return {
      run: mostRecentRun,
      logs,
    };
  } catch (error) {
    console.error("⚠️ Monitoring via MCP failed:", error);
    return { run: null, logs: "" };
  }
}
