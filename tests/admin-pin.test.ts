import assert from "node:assert/strict";
import test from "node:test";
import { hashAdminPin, isHashedAdminPin, verifyAdminPin } from "../server/admin-pin";

const TEST_ADMIN_PIN = "fixture-admin-pin";
const WRONG_TEST_PIN = "wrong-fixture-pin";

test("admin PINs are stored as bcrypt hashes and verify without exposing the input", async () => {
  const hash = await hashAdminPin(TEST_ADMIN_PIN);

  assert.notEqual(hash, TEST_ADMIN_PIN);
  assert.equal(isHashedAdminPin(hash), true);
  assert.deepEqual(await verifyAdminPin(TEST_ADMIN_PIN, hash), { valid: true, needsRehash: false });
  assert.deepEqual(await verifyAdminPin(WRONG_TEST_PIN, hash), { valid: false, needsRehash: false });
});

test("legacy plaintext PINs are accepted once and marked for rehash", async () => {
  assert.deepEqual(await verifyAdminPin(TEST_ADMIN_PIN, TEST_ADMIN_PIN), { valid: true, needsRehash: true });
  assert.deepEqual(await verifyAdminPin(WRONG_TEST_PIN, TEST_ADMIN_PIN), { valid: false, needsRehash: false });
});

test("admin PIN hashing rejects values outside the supported length", async () => {
  await assert.rejects(() => hashAdminPin("123"));
  await assert.rejects(() => hashAdminPin("x".repeat(65)));
  assert.deepEqual(await verifyAdminPin("123", "123"), { valid: false, needsRehash: false });
});
