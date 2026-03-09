import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

export interface MCPToolResult {
  toolName: string;
  result: string;
  success: boolean;
}

export async function initMCPServer(): Promise<Client> {
  const server = new Server(
    { name: "devops-mcp-server", version: "1.0.0" },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_failed_runs",
        description: "Monitor GitHub CI/CD failures",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string" },
            repo: { type: "string" },
          },
        },
      },
      {
        name: "get_run_logs",
        description: "Fetch workflow run logs",
        inputSchema: {
          type: "object",
          properties: {
            runId: { type: "number" },
          },
        },
      },
      {
        name: "create_branch",
        description: "Create a fix branch on GitHub",
        inputSchema: {
          type: "object",
          properties: {
            branchName: { type: "string" },
          },
        },
      },
      {
        name: "create_pr",
        description: "Open a pull request with fix",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            body: { type: "string" },
          },
        },
      },
      {
        name: "deploy_fix",
        description: "Deploy remediation to Azure",
        inputSchema: {
          type: "object",
          properties: {
            environment: { type: "string" },
            artifact: { type: "string" },
          },
        },
      },
      {
        name: "create_alert",
        description: "Set up monitoring alerts",
        inputSchema: {
          type: "object",
          properties: {
            alertName: { type: "string" },
            severity: { type: "string" },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => ({
    content: [
      {
        type: "text",
        text: "Tool executed: " + request.params.name,
      },
    ],
  }));

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);

  const client = new Client(
    { name: "devops-orchestrator", version: "1.0.0" },
    {},
  );

  await client.connect(clientTransport);

  return client;
}

export async function listMCPCapabilities(): Promise<string[]> {
  const client = await initMCPServer();
  const { tools } = await client.listTools();
  const capabilities = tools.map(
    (tool) => `${tool.name} - ${tool.description ?? "No description"}`,
  );

  console.log(`🔌 MCP capabilities registered: ${capabilities.length} tools`);

  return capabilities;
}
