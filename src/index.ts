import dotenv from "dotenv";

import { runMonitoringAgent } from "./agents/monitoringAgent";

async function main(): Promise<void> {
  try {
    dotenv.config();

    const { getClient } = await import("./tools/foundryClient");
    const client = getClient();
    const agents: unknown[] = [];

    for await (const agent of client.agents.list()) {
      agents.push(agent);
    }

    console.log("✅ Foundry connected. Agents available:", agents);

    const monitoringResult = await runMonitoringAgent("microsoft", "vscode");
    console.log("Monitoring agent result:", monitoringResult);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

void main();
