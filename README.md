# 🤖 Intelligent DevOps Orchestrator

> Autonomous multi-agent system that detects CI/CD failures and creates fix PRs — without human intervention.

## 🏆 Built for Microsoft AI Dev Days Hackathon
**Challenge:** Automate and Optimize Software Delivery - Agentic DevOps

## 🎯 What It Does
Intelligent DevOps Orchestrator watches GitHub Actions workflow failures, retrieves diagnostic logs through an MCP tool layer, and routes the incident through a chain of specialized agents. The system uses Azure AI Foundry to execute persistent triage and fix agents on GPT-4o, then prepares a pull request artifact so engineering teams can move from failure detection to review-ready action in minutes instead of hours.

## 🏗️ Architecture
```text
+-----------------+    +-------------------------+    +-------------------------+    +----------------------+    +------------------+
| GitHub CI/CD    | -> | Monitoring Agent (MCP)  | -> | Triage Agent (Foundry)  | -> | Fix Agent (Foundry) | -> | PR Agent (GitHub)|
| failed workflow |    | runs + logs via tools   |    | classify cause          |    | generate fix        |    | create PR        |
+-----------------+    +-------------------------+    +-------------------------+    +----------------------+    +------------------+
```

## 🛠️ Tech Stack
| Technology | Purpose |
|---|---|
| Microsoft Azure AI Foundry | Agent registry, persistent instructions, and GPT-4o execution runtime |
| Azure OpenAI (GPT-4o) | Model deployment backing triage and fix reasoning in Foundry |
| Microsoft Agent Framework (`@azure/ai-projects`) | Foundry project connectivity plus conversation and response orchestration |
| Azure Application Insights | Observability and telemetry |
| GitHub Actions API (Octokit) | Workflow monitoring, branch creation, and PR automation |
| Model Context Protocol (MCP) | Runtime tool boundary for monitoring workflows and log retrieval, with 4 extension points registered |
| TypeScript / Node.js | Runtime and orchestration layer |

## 🤖 The Four Agents

### 1. 🔍 Monitoring Agent
The Monitoring Agent calls MCP tools to inspect GitHub Actions for the most recent failed workflow runs in a repository. It surfaces the latest incidents, captures core metadata such as commit message and run URL, and fetches workflow logs through the MCP server for downstream analysis.

### 2. 🧠 Triage Agent
The Triage Agent is registered once in Azure AI Foundry with persistent instructions and executed at runtime through `AIProjectClient`. It classifies each failure into categories such as test failure, security vulnerability, performance regression, tech debt, dependency update, or unknown, then assigns severity and suggests the most actionable next step.

### 3. 🔧 Fix Agent
The Fix Agent is also a Foundry-managed prompt agent with persistent instructions. It converts triage output into a structured remediation proposal with a fix description, draft code or configuration changes, likely affected files, and a confidence score for human reviewers.

### 4. 🚀 PR Agent
The PR Agent operationalizes the fix by creating a dedicated branch, writing an auto-fix report into the repository, and opening a pull request with the incident summary, proposed remediation, and review guidance. Every PR is explicitly labeled as auto-generated for safe human oversight.

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Azure CLI (`az login`)
- Azure AI Foundry project with GPT-4o deployed
- GitHub Personal Access Token

### Installation
```bash
git clone https://github.com/AJ-EN/intelligent-devops-orchestrator
cd intelligent-devops-orchestrator
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Fill in your values
```

Required env vars:
```text
AZURE_AI_PROJECT_ENDPOINT=
AZURE_OPENAI_ENDPOINT=
AZURE_MONITOR_CONNECTION_STRING=
GITHUB_TOKEN=
```

### Run
```bash
# Target any public GitHub repo
npm run dev -- <owner> <repo>

# Example
npm run dev -- AJ-EN devops-test
```

## 🔄 Pipeline Flow
1. The application boots, initializes Azure Monitor telemetry, and connects to Azure AI Foundry.
2. The MCP server registers tool capabilities and exposes GitHub monitoring tools to the pipeline.
3. The Monitoring Agent calls MCP tools to fetch recent failed workflow runs and retrieve the latest workflow logs.
4. If no failures are found, the pipeline exits cleanly with no downstream agent work.
5. When a failure is detected, the Triage Agent executes through Azure AI Foundry using its registered persistent instructions and returns structured JSON.
6. The Fix Agent executes through Azure AI Foundry using the triage result and returns a concrete remediation proposal.
7. A human approval gate asks whether the auto-generated remediation should be converted into a pull request.
8. If approved, the PR Agent creates a branch, commits an auto-fix report, and opens a GitHub pull request for review.

## 🛡️ Responsible AI
- Human-in-the-loop approval before any PR is created
- All PRs are clearly labeled as auto-generated
- No code is merged automatically — human review always required
- Azure Content Safety via DefaultV2 content filtering on GPT-4o

## 📊 Observability
The orchestrator integrates Azure Application Insights through Azure Monitor OpenTelemetry. Startup telemetry is initialized at runtime so agent execution, failures, and pipeline behavior can be captured in a centralized monitoring surface for operational visibility.

## 🏅 Hackathon Judging Criteria Alignment
| Criterion | Implementation |
|---|---|
| Microsoft Foundry | Registered prompt agents with persistent instructions for monitoring, triage, fix, and PR roles |
| Agent Framework | `AIProjectClient` executes triage and fix through Foundry conversations and `agent_reference` responses |
| Azure MCP | Monitoring executes through MCP `list_failed_runs` and `get_run_logs`; 4 additional tool capabilities are registered as extension points |
| Real-world Impact | Saves hours of manual triage per incident |
| Agentic DevOps | End-to-end CI/CD automation from failure detection to human-approved PR creation |

## 📄 License
MIT
