import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_WHEEL_CONFIGURATION,
  getPublicWheelConfiguration,
  wheelConfigurationSchema,
} from "../shared/wheel-config";

test("accepts the configured default lots and turn grants", () => {
  assert.equal(wheelConfigurationSchema.safeParse(DEFAULT_WHEEL_CONFIGURATION).success, true);
});

test("omits disabled zero-probability prizes from the public wheel", () => {
  const configuration = {
    ...DEFAULT_WHEEL_CONFIGURATION,
    prizes: DEFAULT_WHEEL_CONFIGURATION.prizes.map((prize, index) => (
      index === 0
        ? { ...prize, active: false, probability: 0 }
        : index === 1
          ? { ...prize, probability: 20 }
          : prize
    )),
  };

  assert.equal(wheelConfigurationSchema.safeParse(configuration).success, true);
  assert.equal(getPublicWheelConfiguration(configuration).prizes.length, 9);
  assert.ok(getPublicWheelConfiguration(configuration).prizes.every((prize) => prize.active && prize.probability > 0));
});

test("rejects active odds that do not total one hundred percent", () => {
  const configuration = {
    ...DEFAULT_WHEEL_CONFIGURATION,
    prizes: DEFAULT_WHEEL_CONFIGURATION.prizes.map((prize, index) => (
      index === 0 ? { ...prize, probability: 9 } : prize
    )),
  };

  assert.equal(wheelConfigurationSchema.safeParse(configuration).success, false);
});

test("rejects an active prize with zero probability", () => {
  const configuration = {
    ...DEFAULT_WHEEL_CONFIGURATION,
    prizes: DEFAULT_WHEEL_CONFIGURATION.prizes.map((prize, index) => (
      index === 0 ? { ...prize, probability: 0 } : prize
    )),
  };

  assert.equal(wheelConfigurationSchema.safeParse(configuration).success, false);
});
