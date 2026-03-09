# 🤖 Intelligent DevOps Orchestrator

> Autonomous multi-agent system that detects CI/CD failures and creates fix PRs — without human intervention.

## 🏆 Built for Microsoft AI Dev Days Hackathon
**Challenge:** Automate and Optimize Software Delivery - Agentic DevOps

## 🎯 What It Does
Intelligent DevOps Orchestrator watches GitHub Actions workflow failures, retrieves diagnostic logs, and routes the incident through a chain of specialized agents. The system triages the root cause with Azure OpenAI, generates a concrete remediation proposal, and prepares a pull request artifact so engineering teams can move from failure detection to review-ready action in minutes instead of hours.

## 🏗️ Architecture
```text
+-----------------+    +-------------------+    +----------------+    +-------------+    +--------------+
| GitHub CI/CD    | -> | Monitoring Agent  | -> | Triage Agent   | -> | Fix Agent   | -> | PR Agent     |
| failed workflow |    | find failed runs  |    | classify cause |    | generate fix|    | create PR    |
+-----------------+    +-------------------+    +----------------+    +-------------+    +--------------+
```

## 🛠️ Tech Stack
| Technology | Purpose |
|---|---|
| Microsoft Azure AI Foundry | Project orchestration and model deployment foundation |
| Azure OpenAI (GPT-4o) | Triage analysis and fix generation |
| Microsoft Agent Framework (`@azure/ai-projects`) | Agent management and Foundry project connectivity |
| Azure Application Insights | Observability and telemetry |
| GitHub Actions API (Octokit) | CI/CD monitoring, branch creation, and PR automation |
| Azure MCP Server | Tool orchestration pattern for extensible service integrations |
| TypeScript / Node.js | Runtime and orchestration layer |

## 🤖 The Four Agents

### 1. 🔍 Monitoring Agent
The Monitoring Agent polls GitHub Actions for the most recent failed workflow runs in a repository. It surfaces the latest incidents, captures core metadata such as commit message and run URL, and pulls workflow logs for downstream analysis.

### 2. 🧠 Triage Agent
The Triage Agent uses GPT-4o on Azure OpenAI to classify each failure into categories such as test failure, security vulnerability, performance regression, tech debt, dependency update, or unknown. It also assigns severity, summarizes the issue, and recommends the most actionable next step.

### 3. 🔧 Fix Agent
The Fix Agent converts triage output into a concrete remediation proposal. It generates a structured fix description, draft code or configuration changes, likely affected files, and a confidence score that helps teams understand how much manual validation is required.

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
2. The Monitoring Agent checks GitHub Actions for recent failed workflow runs in the target repository.
3. If no failures are found, the pipeline exits cleanly with no downstream agent work.
4. When a failure is detected, workflow logs are downloaded and trimmed into an analysis-friendly payload.
5. The Triage Agent classifies the incident, assigns severity, and produces a concise remediation summary.
6. The Fix Agent transforms that triage result into a concrete fix proposal with likely files and code/config updates.
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
| Microsoft Foundry | Project management, model deployment, agent registry |
| Agent Framework | AIProjectClient, 4-agent orchestration |
| Azure MCP | MCPTools module registers 6 tool capabilities: GitHub monitoring, Azure deployment, DevOps automation |
| GitHub Copilot Agent Mode | Integrated in fix generation pipeline |
| Real-world Impact | Saves hours of manual triage per incident |
| Agentic DevOps | Full CI/CD automation from detection to PR |

## 📄 License
MIT
