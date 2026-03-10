import type { AIProjectClient } from "@azure/ai-projects";

import type { TriageResult } from "./triageAgent";
import type { FoundryAgentRegistration } from "../tools/foundryClient";
import { extractMessageContent } from "../tools/llmTools";

type FixConfidence = "high" | "medium" | "low";

export interface FixResult {
  triageRunId: number;
  fixDescription: string;
  codeChanges: string;
  filesAffected: string[];
  confidence: FixConfidence;
}

function isValidConfidence(value: unknown): value is FixConfidence {
  return value === "high" || value === "medium" || value === "low";
}

export async function runFixAgent(
  client: AIProjectClient,
  agent: FoundryAgentRegistration,
  triage: TriageResult,
): Promise<FixResult> {
  try {
    const openAIClient = client.getOpenAIClient();
    const conversation = await openAIClient.conversations.create({
      items: [
        {
          type: "message",
          role: "user",
          content: `Generate a fix for this CI/CD failure:

Category: ${triage.category}
Severity: ${triage.severity}
Summary: ${triage.summary}
Suggested Fix: ${triage.suggestedFix}

Respond with exactly this JSON:
{
  "fixDescription": "what this fix does in one sentence",
  "codeChanges": "the actual code or config change needed, as a code snippet",
  "filesAffected": ["list", "of", "likely", "files"],
  "confidence": "high|medium|low"
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
        fixDescription: unknown;
        codeChanges: unknown;
        filesAffected: unknown;
        confidence: unknown;
      };

      if (
        typeof parsed.fixDescription !== "string" ||
        typeof parsed.codeChanges !== "string" ||
        !Array.isArray(parsed.filesAffected) ||
        !parsed.filesAffected.every((file) => typeof file === "string") ||
        !isValidConfidence(parsed.confidence)
      ) {
        throw new Error("Invalid fix payload");
      }

      return {
        triageRunId: triage.runId,
        fixDescription: parsed.fixDescription,
        codeChanges: parsed.codeChanges,
        filesAffected: parsed.filesAffected,
        confidence: parsed.confidence,
      };
    } finally {
      await openAIClient.conversations.delete(conversation.id).catch(() => undefined);
    }
  } catch {
    return {
      triageRunId: triage.runId,
      fixDescription: "Could not generate fix",
      codeChanges: "",
      filesAffected: [],
      confidence: "low",
    };
  }
}
