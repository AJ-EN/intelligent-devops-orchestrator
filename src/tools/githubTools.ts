import { inflateRawSync } from "node:zlib";

import { Octokit } from "@octokit/rest";

const FAILED_RUN_LIMIT = 5;
const LOG_PREVIEW_LIMIT = 3000;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_LOCAL_FILE_SIGNATURE = 0x04034b50;

export interface WorkflowRun {
  id: number;
  name: string;
  conclusion: string | null;
  head_commit_message: string;
  created_at: string;
  html_url: string;
}

function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN is not set.");
  }

  return token;
}

function getOctokit(): Octokit {
  return new Octokit({
    auth: getGitHubToken(),
  });
}

function findEndOfCentralDirectoryOffset(buffer: Buffer): number {
  const minimumRecordLength = 22;
  const searchStart = Math.max(0, buffer.length - 0xffff - minimumRecordLength);

  for (let offset = buffer.length - minimumRecordLength; offset >= searchStart; offset -= 1) {
    if (buffer.readUInt32LE(offset) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return offset;
    }
  }

  throw new Error("ZIP end of central directory record not found.");
}

function extractLogTextFromZip(buffer: Buffer): string {
  const endOfCentralDirectoryOffset = findEndOfCentralDirectoryOffset(buffer);
  const centralDirectorySize = buffer.readUInt32LE(endOfCentralDirectoryOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(endOfCentralDirectoryOffset + 16);
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;
  const logChunks: string[] = [];

  for (let offset = centralDirectoryOffset; offset < centralDirectoryEnd; ) {
    if (buffer.readUInt32LE(offset) !== ZIP_CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error("Invalid ZIP central directory header.");
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const fileCommentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileNameStart = offset + 46;
    const fileNameEnd = fileNameStart + fileNameLength;
    const fileName = buffer.subarray(fileNameStart, fileNameEnd).toString("utf8");

    offset = fileNameEnd + extraFieldLength + fileCommentLength;

    if (fileName.endsWith("/")) {
      continue;
    }

    if (buffer.readUInt32LE(localHeaderOffset) !== ZIP_LOCAL_FILE_SIGNATURE) {
      throw new Error("Invalid ZIP local file header.");
    }

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraFieldLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const fileDataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
    const compressedData = buffer.subarray(fileDataOffset, fileDataOffset + compressedSize);

    let fileContents: Buffer;
    if (compressionMethod === 0) {
      fileContents = compressedData;
    } else if (compressionMethod === 8) {
      fileContents = inflateRawSync(compressedData);
    } else {
      continue;
    }

    const text = fileContents.toString("utf8").trim();
    if (text.length > 0) {
      logChunks.push(`[${fileName}]\n${text}`);
    }
  }

  return logChunks.join("\n\n").slice(0, LOG_PREVIEW_LIMIT);
}

export async function getFailedRuns(
  owner: string,
  repo: string,
): Promise<WorkflowRun[]> {
  const octokit = getOctokit();
  const response = await octokit.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    status: "failure",
    per_page: FAILED_RUN_LIMIT,
  });

  return response.data.workflow_runs.slice(0, FAILED_RUN_LIMIT).map((run) => ({
    id: run.id,
    name: run.name ?? run.display_title ?? "Unnamed workflow",
    conclusion: run.conclusion ?? null,
    head_commit_message: run.head_commit?.message ?? "No commit message available",
    created_at: run.created_at,
    html_url: run.html_url,
  }));
}

export async function getRunLogs(
  owner: string,
  repo: string,
  runId: number,
): Promise<string> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/logs`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${getGitHubToken()}`,
          "User-Agent": "intelligent-devops-orchestrator",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!response.ok) {
      return "Logs unavailable";
    }

    const zipBuffer = Buffer.from(await response.arrayBuffer());
    const logs = extractLogTextFromZip(zipBuffer);

    return logs.length > 0 ? logs : "Logs unavailable";
  } catch {
    return "Logs unavailable";
  }
}
