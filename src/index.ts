import dotenv from "dotenv";

import { runFixAgent } from "./agents/fixAgent";
import { runMonitoringAgent } from "./agents/monitoringAgent";
import { runPRAgent } from "./agents/prAgent";
import { runTriageAgent } from "./agents/triageAgent";
import { getRunLogs } from "./tools/githubTools";

async function main(): Promise<void> {
  try {
    const owner = "AJ-EN";
    const repo = "devops-test";

    dotenv.config();

    const { getClient } = await import("./tools/foundryClient");
    const client = getClient();
    const agents: unknown[] = [];

    for await (const agent of client.agents.list()) {
      agents.push(agent);
    }

    console.log("✅ Foundry connected. Agents available:", agents);

    const monitoringResult = await runMonitoringAgent(owner, repo);
    console.log("Monitoring agent result:", monitoringResult);

    if (!monitoringResult) {
      return;
    }

    const logs = await getRunLogs(owner, repo, monitoringResult.id);
    const triageResult = await runTriageAgent(monitoringResult, logs);
    console.log("🔍 Triage result:", JSON.stringify(triageResult, null, 2));
    const fixResult = await runFixAgent(triageResult);
    console.log("🔧 Fix result:", JSON.stringify(fixResult, null, 2));
    const prResult = await runPRAgent(owner, repo, triageResult, fixResult);
    console.log("🚀 PR result:", JSON.stringify(prResult, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

void main();
