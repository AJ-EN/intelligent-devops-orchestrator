import type { AIProjectClient } from "@azure/ai-projects";

import type { WorkflowRun } from "../tools/githubTools";
import type { FoundryAgentRegistration } from "../tools/foundryClient";
import { extractMessageContent } from "../tools/llmTools";

type TriageCategory =
  | "test_failure"
  | "security_vulnerability"
  | "performance_regression"
  | "tech_debt"
  | "dependency_update"
  | "unknown";

type TriageSeverity = "critical" | "high" | "medium" | "low";

export interface TriageResult {
  runId: number;
  runName: string;
  category: TriageCategory;
  severity: TriageSeverity;
  summary: string;
  suggestedFix: string;
}

function isValidCategory(value: unknown): value is TriageCategory {
  return (
    value === "test_failure" ||
    value === "security_vulnerability" ||
    value === "performance_regression" ||
    value === "tech_debt" ||
    value === "dependency_update" ||
    value === "unknown"
  );
}

function isValidSeverity(value: unknown): value is TriageSeverity {
  return (
    value === "critical" ||
    value === "high" ||
    value === "medium" ||
    value === "low"
  );
}

export async function runTriageAgent(
  client: AIProjectClient,
  agent: FoundryAgentRegistration,
  run: WorkflowRun,
  logs: string,
): Promise<TriageResult> {
  try {
    const openAIClient = client.getOpenAIClient();
    const conversation = await openAIClient.conversations.create({
      items: [
        {
          type: "message",
          role: "user",
          content: `Analyze this CI/CD failure:

Workflow: ${run.name}
Commit: ${run.head_commit_message}
Logs: ${logs.substring(0, 2000)}

Respond with exactly this JSON:
{
  "category": "test_failure|security_vulnerability|performance_regression|tech_debt|dependency_update|unknown",
  "severity": "critical|high|medium|low",
  "summary": "one sentence description",
  "suggestedFix": "concrete actionable fix in one sentence"
}`,
        },
      ],
    });

    try {
      const response = await openAIClient.responses.create(
        {
          conversation: conversation.id,
        },
        {
          body: {
            agent: {
              name: agent.name,
              type: "agent_reference",
            },
          },
        },
      );
      const content = extractMessageContent(response.output_text);
      const parsed = JSON.parse(content) as {
        category: unknown;
        severity: unknown;
        summary: unknown;
        suggestedFix: unknown;
      };

      if (
        !isValidCategory(parsed.category) ||
        !isValidSeverity(parsed.severity) ||
        typeof parsed.summary !== "string" ||
        typeof parsed.suggestedFix !== "string"
      ) {
        throw new Error("Invalid triage payload");
      }

      return {
        runId: run.id,
        runName: run.name,
        category: parsed.category,
        severity: parsed.severity,
        summary: parsed.summary,
        suggestedFix: parsed.suggestedFix,
      };
    } finally {
      await openAIClient.conversations.delete(conversation.id).catch(() => undefined);
    }
  } catch {
    return {
      runId: run.id,
      runName: run.name,
      category: "unknown",
      severity: "low",
      summary: "Could not parse failure",
      suggestedFix: "Manual review required",
    };
  }
}
