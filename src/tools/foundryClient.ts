import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

export function getClient(): AIProjectClient {
  return new AIProjectClient(
    process.env.AZURE_AI_PROJECT_ENDPOINT!,
    new DefaultAzureCredential(),
  );
}
