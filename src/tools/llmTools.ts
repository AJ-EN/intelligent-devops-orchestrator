export function extractMessageContent(content: string | null): string {
  return (content ?? "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();
}
