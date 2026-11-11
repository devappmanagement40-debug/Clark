import assert from "node:assert/strict";
import test from "node:test";
import { queryClient } from "../client/src/lib/queryClient";

test("cached pages refresh quickly without polling continuously", () => {
  const queries = queryClient.getDefaultOptions().queries;

  assert.equal(queries?.staleTime, 15_000);
  assert.equal(queries?.refetchOnMount, true);
  assert.equal(queries?.refetchOnWindowFocus, true);
  assert.equal(queries?.refetchInterval, false);
});
