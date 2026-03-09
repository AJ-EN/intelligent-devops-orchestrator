import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import { useAzureMonitor } from "@azure/monitor-opentelemetry";

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
  return new AIProjectClient(
    process.env.AZURE_AI_PROJECT_ENDPOINT!,
    new DefaultAzureCredential(),
  );
}
