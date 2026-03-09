import "@azure/openai/types";

import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { AzureOpenAI } from "openai";

import type { WorkflowRun } from "../tools/githubTools";

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

function getMessageContent(content: string | null): string {
  return content ?? "";
}

export async function runTriageAgent(
  run: WorkflowRun,
  logs: string,
): Promise<TriageResult> {
  const credential = new DefaultAzureCredential();
  const azureADTokenProvider = getBearerTokenProvider(
    credential,
    "https://cognitiveservices.azure.com/.default",
  );
  const openai = new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    azureADTokenProvider,
    deployment: "gpt-4o",
    apiVersion: "2024-10-21",
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a DevOps triage expert. Always respond in valid JSON only, no markdown, no explanation.",
      },
      {
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
    temperature: 0,
  });

  const content = getMessageContent(response.choices[0]?.message?.content ?? "");

  try {
    const parsed = JSON.parse(content) as {
      category: TriageCategory;
      severity: TriageSeverity;
      summary: string;
      suggestedFix: string;
    };

    return {
      runId: run.id,
      runName: run.name,
      category: parsed.category,
      severity: parsed.severity,
      summary: parsed.summary,
      suggestedFix: parsed.suggestedFix,
    };
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
