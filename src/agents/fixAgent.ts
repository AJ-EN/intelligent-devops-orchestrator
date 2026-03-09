import "@azure/openai/types";

import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { AzureOpenAI } from "openai";

import type { TriageResult } from "./triageAgent";
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

export async function runFixAgent(triage: TriageResult): Promise<FixResult> {
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
          "You are an expert software engineer. Generate concrete code fixes for CI/CD failures. Always respond in valid JSON only, no markdown, no explanation.",
      },
      {
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
    temperature: 0,
  });

  const content = extractMessageContent(
    response.choices[0]?.message?.content ?? "",
  );

  try {
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
