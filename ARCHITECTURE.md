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
2. **Detection:** Monitoring Agent fetches last 5 failed workflow runs
3. **Analysis:** Triage Agent sends logs to GPT-4o → structured JSON
4. **Remediation:** Fix Agent sends triage to GPT-4o → code fix JSON
5. **Gate:** Human approves or cancels PR creation
6. **Output:** GitHub PR with fix report on dedicated branch

## Technology Mapping

| Agent | Primary Service | SDK |
|---|---|---|
| Monitoring | GitHub Actions API | @octokit/rest |
| Triage | Azure OpenAI GPT-4o | openai + @azure/openai |
| Fix | Azure OpenAI GPT-4o | openai + @azure/openai |
| PR | GitHub REST API | @octokit/rest |
| Orchestration | Azure AI Foundry | @azure/ai-projects |
| Observability | Azure App Insights | @azure/monitor-opentelemetry |
| Tool Layer | MCP Protocol | @modelcontextprotocol/sdk |
