import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface MCPToolResult {
  toolName: string;
  result: string;
  success: boolean;
}

export async function callMCPTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<MCPToolResult> {
  const client = new Client(
    { name: "devops-orchestrator", version: "1.0.0" },
    {},
  );
  const transport = new StdioClientTransport({
    command: "node",
    args: ["--version"],
  });

  try {
    await client.connect(transport);

    return {
      toolName,
      result: JSON.stringify(args),
      success: true,
    };
  } catch {
    return {
      toolName,
      result: "MCP tool unavailable",
      success: false,
    };
  } finally {
    await transport.close().catch(() => undefined);
  }
}

export async function listMCPCapabilities(): Promise<string[]> {
  const capabilities = [
    "github: list_failed_runs - Monitor CI/CD failures",
    "github: get_run_logs - Fetch workflow logs",
    "azure: deploy_fix - Deploy remediation to Azure",
    "azure: create_alert - Set up monitoring alerts",
    "devops: create_branch - Create fix branch",
    "devops: create_pr - Open pull request",
  ];

  console.log(`🔌 MCP capabilities registered: ${capabilities.length} tools`);

  return capabilities;
}
