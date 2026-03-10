# 🏗️ System Architecture

## Agent Pipeline
```
┌─────────────────────────────────────────────────────────────────┐
│                 Intelligent DevOps Orchestrator                  │
│                    Microsoft AI Dev Days 2026                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Azure Monitor   │
                    │   (Telemetry)     │
                    │  App Insights     │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Azure AI Foundry │
                    │  (AIProjectClient)│
                    │  GPT-4o deployed  │
                    └─────────┬─────────┘
                              │
              ┌───────────────▼───────────────┐
              │        MCP Tool Layer          │
              │  GitHub | Azure | DevOps tools │
              └───────────────┬───────────────┘
                              │
          ┌───────────────────▼───────────────────┐
          │                                        │
 ┌────────▼────────┐                    ┌─────────▼────────┐
 │ GitHub Actions  │                    │  Azure OpenAI    │
 │   REST API      │                    │  GPT-4o          │
 └────────┬────────┘                    └─────────┬────────┘
          │                                        │
          ▼                                        │
┌──────────────────┐                              │
│ 1. MONITORING    │                              │
│    AGENT         │                              │
│ • Polls failures │                              │
│ • Fetches logs   │                              │
│ • Returns run    │                              │
└────────┬─────────┘                              │
         │                                        │
         ▼                                        │
┌──────────────────┐                             │
│ 2. TRIAGE        │◄────────────────────────────┘
│    AGENT         │     GPT-4o analyzes logs
│ • Classifies     │
│ • Assigns severity│
│ • Suggests fix   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. FIX           │◄────────────────────────────┐
│    AGENT         │     GPT-4o generates fix     │
│ • Code changes   │                              │
│ • Files affected │                    ┌─────────┴────────┐
│ • Confidence     │                    │  Azure OpenAI    │
└────────┬─────────┘                    │  GPT-4o          │
         │                              └──────────────────┘
         ▼
┌──────────────────┐
│ ⚠️  HUMAN        │
│    APPROVAL      │
│    GATE          │
│ yes/no prompt    │
└────────┬─────────┘
         │ (approved)
         ▼
┌──────────────────┐
│ 4. PR            │
│    AGENT         │
│ • Creates branch │
│ • Commits fix    │
│ • Opens PR       │
│ • Labels auto-   │
│   generated      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  GitHub Pull     │
│  Request         │
│  (human reviews) │
└──────────────────┘
```

## Data Flow

1. **Input:** GitHub repo owner + repo name (CLI args)
2. **Detection:** Monitoring Agent calls MCP tools to fetch the last 5 failed workflow runs and download logs
3. **Analysis:** Triage Agent executes through Azure AI Foundry → structured JSON
4. **Remediation:** Fix Agent executes through Azure AI Foundry → code fix JSON
5. **Gate:** Human approves or cancels PR creation
6. **Output:** GitHub PR with fix report on dedicated branch

## Technology Mapping

| Agent | Primary Service | SDK |
|---|---|---|
| Monitoring | MCP tool layer over GitHub Actions API | @modelcontextprotocol/sdk + @octokit/rest |
| Triage | Azure AI Foundry prompt agent (GPT-4o) | @azure/ai-projects |
| Fix | Azure AI Foundry prompt agent (GPT-4o) | @azure/ai-projects |
| PR | GitHub REST API | @octokit/rest |
| Orchestration | Azure AI Foundry | @azure/ai-projects |
| Observability | Azure App Insights | @azure/monitor-opentelemetry |
| Tool Layer | MCP Protocol | @modelcontextprotocol/sdk |
