import readline from "node:readline";

import dotenv from "dotenv";

import { runFixAgent } from "./agents/fixAgent";
import { runMonitoringAgent } from "./agents/monitoringAgent";
import { runPRAgent } from "./agents/prAgent";
import { runTriageAgent } from "./agents/triageAgent";
import { initMCPServer, listMCPCapabilities } from "./tools/mcpTools";
import {
  getClient,
  initTelemetry,
  registerAgents,
} from "./tools/foundryClient";

dotenv.config();

async function main(): Promise<void> {
  initTelemetry();
  const mcpClient = await initMCPServer();
  const mcpCapabilities = await listMCPCapabilities(mcpClient);
  console.log("🔌 MCP tools:", mcpCapabilities);

  const owner = process.argv[2] ?? "AJ-EN";
  const repo = process.argv[3] ?? "devops-test";
  console.log(`🎯 Targeting: ${owner}/${repo}`);

  try {
    const client = getClient();
    const registry = await registerAgents(client);
    console.log(
      "🤖 Agents registered in Foundry:",
      Object.values(registry).map((agent) => agent.name),
    );
    const agents: unknown[] = [];

    for await (const agent of client.agents.list()) {
      agents.push(agent);
    }

    console.log("✅ Foundry connected. Agents available:", agents);

    const monitoringResult = await runMonitoringAgent(mcpClient, owner, repo);
    console.log("Monitoring agent result:", monitoringResult);

    if (!monitoringResult.run) {
      return;
    }

    const triageResult = await runTriageAgent(
      client,
      registry.triage,
      monitoringResult.run,
      monitoringResult.logs,
    );
    console.log("🔍 Triage result:", JSON.stringify(triageResult, null, 2));

    const fixResult = await runFixAgent(client, registry.fix, triageResult);
    console.log("🔧 Fix result:", JSON.stringify(fixResult, null, 2));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const approved = await new Promise<boolean>((resolve) => {
      rl.question("\n⚠️  Auto-fix ready. Create PR? (yes/no): ", (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === "yes");
      });
    });

    if (!approved) {
      console.log("🛑 PR creation cancelled by user.");
      process.exit(0);
    }

    const prResult = await runPRAgent(owner, repo, triageResult, fixResult);
    console.log("🚀 PR result:", JSON.stringify(prResult, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

void main();
