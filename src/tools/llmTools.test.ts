import assert from "node:assert/strict";
import test from "node:test";

import { extractMessageContent } from "./llmTools";

test("extractMessageContent returns raw content when no code fences exist", () => {
  assert.equal(
    extractMessageContent('{ "category": "test_failure" }'),
    '{ "category": "test_failure" }',
  );
});

test("extractMessageContent strips json code fences", () => {
  assert.equal(
    extractMessageContent('```json\n{ "severity": "high" }\n```'),
    '{ "severity": "high" }',
  );
});

test("extractMessageContent strips generic code fences and whitespace", () => {
  assert.equal(
    extractMessageContent('\n```  \n{ "summary": "trim me" }\n```   \n'),
    '{ "summary": "trim me" }',
  );
});
