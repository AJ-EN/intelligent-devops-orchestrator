import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import { useAzureMonitor } from "@azure/monitor-opentelemetry";

const FOUNDRY_AGENT_DEFINITIONS = [
  {
    key: "monitoring",
    name: "monitoring-agent",
    instructions:
      "You monitor GitHub Actions and CI/CD systems, detect failed runs, and summarize the incident context for downstream agents.",
  },
  {
    key: "triage",
    name: "triage-agent",
    instructions:
      "You are a DevOps triage expert. Analyze CI/CD failures, classify the root cause, assign severity, and recommend the most actionable remediation path. Always respond in valid JSON only, no markdown, no explanation.",
  },
  {
    key: "fix",
    name: "fix-agent",
    instructions:
      "You are an expert software engineer. Generate concrete code or configuration fixes for CI/CD failures and identify the files most likely to be affected. Always respond in valid JSON only, no markdown, no explanation.",
  },
  {
    key: "pr",
    name: "pr-agent",
    instructions:
      "You prepare safe, reviewable pull requests that document the issue, proposed fix, and the expected impact of the change.",
  },
] as const;

export interface FoundryAgentRegistration {
  id: string;
  name: string;
}

export interface FoundryAgentRegistry {
  monitoring: FoundryAgentRegistration;
  triage: FoundryAgentRegistration;
  fix: FoundryAgentRegistration;
  pr: FoundryAgentRegistration;
}

async function ensureAgent(
  client: AIProjectClient,
  agentDefinition: (typeof FOUNDRY_AGENT_DEFINITIONS)[number],
): Promise<FoundryAgentRegistration> {
  try {
    const agent = await client.agents.create(agentDefinition.name, {
      kind: "prompt",
      model: "gpt-4o",
      instructions: agentDefinition.instructions,
    });

    return { id: agent.id, name: agent.name };
  } catch {
    try {
      const agent = await client.agents.update(agentDefinition.name, {
        kind: "prompt",
        model: "gpt-4o",
        instructions: agentDefinition.instructions,
      });

      return { id: agent.id, name: agent.name };
    } catch {
      const agent = await client.agents.get(agentDefinition.name);

      return { id: agent.id, name: agent.name };
    }
  }
}

export function initTelemetry(): void {
  try {
    const connectionString = process.env.AZURE_MONITOR_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error("AZURE_MONITOR_CONNECTION_STRING is not set.");
    }

    useAzureMonitor({
      azureMonitorExporterOptions: {
        connectionString,
      },
    });
    console.log("📊 Telemetry initialized");
  } catch {
    console.log("⚠️ Telemetry unavailable");
  }
}

export function getClient(): AIProjectClient {
  process.env.AZURE_TOKEN_CREDENTIALS ??= "AzureCliCredential";

  return new AIProjectClient(
    process.env.AZURE_AI_PROJECT_ENDPOINT!,
    new DefaultAzureCredential(),
  );
}

export async function registerAgents(
  client: AIProjectClient,
): Promise<FoundryAgentRegistry> {
  const registry: Partial<FoundryAgentRegistry> = {};

  for (const agentDefinition of FOUNDRY_AGENT_DEFINITIONS) {
    registry[agentDefinition.key] = await ensureAgent(client, agentDefinition);
    console.log(`Registered agent: ${agentDefinition.name}`);
  }

  return registry as FoundryAgentRegistry;
}
