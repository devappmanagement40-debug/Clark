import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_WHEEL_CONFIGURATION,
  getPublicWheelConfiguration,
  getWheelDrawWeightTotal,
  parseWheelConfiguration,
  selectWeightedWheelPrize,
  wheelConfigurationSchema,
} from "../shared/wheel-config";

test("accepts the configured default lots and turn grants", () => {
  assert.equal(wheelConfigurationSchema.safeParse(DEFAULT_WHEEL_CONFIGURATION).success, true);
});

test("shows every prize publicly without exposing odds or activation state", () => {
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
  const publicConfiguration = getPublicWheelConfiguration(configuration);
  assert.equal(publicConfiguration.prizes.length, 10);
  assert.deepEqual(Object.keys(publicConfiguration.prizes[0]).sort(), [
    "amount",
    "currency",
    "id",
    "imageUrl",
    "kind",
    "title",
  ]);
});

test("weighted draw never selects disabled prizes", () => {
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
  const selected = selectWeightedWheelPrize(configuration, 0);
  assert.equal(selected.index, 1);
  assert.equal(selected.prize.id, configuration.prizes[1].id);
});

test("weighted draw never selects prizes configured at exactly one percent", () => {
  const configuration = {
    ...DEFAULT_WHEEL_CONFIGURATION,
    prizes: DEFAULT_WHEEL_CONFIGURATION.prizes.map((prize, index) => (
      index === 0 ? { ...prize, probability: 1 }
        : index === 1 ? { ...prize, probability: 2 }
          : { ...prize, active: false, probability: 0 }
    )),
  };
  const totalWeight = getWheelDrawWeightTotal(configuration);

  assert.equal(wheelConfigurationSchema.safeParse(configuration).success, true);
  assert.equal(totalWeight, 2 * 100_000_000);
  assert.equal(selectWeightedWheelPrize(configuration, 0).index, 1);
  assert.equal(selectWeightedWheelPrize(configuration, totalWeight - 1).index, 1);
});

test("excludes every rate at or below one percent and keeps rates above it eligible", () => {
  const configuration = {
    ...DEFAULT_WHEEL_CONFIGURATION,
    prizes: DEFAULT_WHEEL_CONFIGURATION.prizes.map((prize, index) => (
      index === 0 ? { ...prize, probability: 0 }
        : index === 1 ? { ...prize, probability: 0.99 }
          : index === 2 ? { ...prize, probability: 1 }
            : index === 3 ? { ...prize, probability: 1.01 }
              : index === 4 ? { ...prize, probability: 2 }
                : { ...prize, active: false, probability: 0 }
    )),
  };
  const totalWeight = getWheelDrawWeightTotal(configuration);

  assert.equal(wheelConfigurationSchema.safeParse(configuration).success, true);
  assert.equal(totalWeight, Math.round(1.01 * 100_000_000) + 2 * 100_000_000);
  assert.equal(selectWeightedWheelPrize(configuration, 0).index, 3);
  assert.equal(selectWeightedWheelPrize(configuration, Math.round(1.01 * 100_000_000)).index, 4);
  assert.equal(selectWeightedWheelPrize(configuration, totalWeight - 1).index, 4);
});

test("rejects a configuration when the only active prizes are at one percent", () => {
  const configuration = {
    ...DEFAULT_WHEEL_CONFIGURATION,
    prizes: DEFAULT_WHEEL_CONFIGURATION.prizes.map((prize, index) => (
      index === 0 ? { ...prize, probability: 1 } : { ...prize, active: false, probability: 0 }
    )),
  };

  assert.equal(wheelConfigurationSchema.safeParse(configuration).success, false);
});

test("loads an existing configuration with no winnable prizes so an admin can correct it", () => {
  const configuration = {
    ...DEFAULT_WHEEL_CONFIGURATION,
    prizes: DEFAULT_WHEEL_CONFIGURATION.prizes.map((prize) => ({ ...prize, probability: 1 })),
  };

  assert.equal(wheelConfigurationSchema.safeParse(configuration).success, false);
  assert.deepEqual(
    parseWheelConfiguration(JSON.stringify(configuration)),
    configuration,
  );
  assert.equal(getWheelDrawWeightTotal(configuration), 0);
  assert.throws(
    () => selectWeightedWheelPrize(configuration, 0),
    /Aucun lot gagnable/,
  );
});

test("weighted draw maps the full configured range to the last eligible prize", () => {
  const configuration = DEFAULT_WHEEL_CONFIGURATION;
  const totalWeight = configuration.prizes.reduce(
    (total, prize) => total + Math.round(prize.probability * 100_000_000),
    0,
  );
  const selected = selectWeightedWheelPrize(configuration, totalWeight - 1);
  assert.equal(selected.index, configuration.prizes.length - 1);
});

test("accepts active rates that do not total one hundred percent", () => {
  const configuration = {
    ...DEFAULT_WHEEL_CONFIGURATION,
    prizes: DEFAULT_WHEEL_CONFIGURATION.prizes.map((prize, index) => (
      index === 0 ? { ...prize, probability: 0 } : index === 1
        ? { ...prize, probability: 20 }
        : index === 2
          ? { ...prize, probability: 30 }
          : { ...prize, active: false, probability: 0 }
    )),
  };

  assert.equal(wheelConfigurationSchema.safeParse(configuration).success, true);
  const totalWeight = getWheelDrawWeightTotal(configuration);
  assert.equal(selectWeightedWheelPrize(configuration, 0).index, 1);
  assert.equal(selectWeightedWheelPrize(configuration, 20 * 100_000_000 - 1).index, 1);
  assert.equal(selectWeightedWheelPrize(configuration, 20 * 100_000_000).index, 2);
  assert.equal(selectWeightedWheelPrize(configuration, totalWeight - 1).index, 2);
});

test("rejects a configuration when every lot has a zero rate", () => {
  const configuration = {
    ...DEFAULT_WHEEL_CONFIGURATION,
    prizes: DEFAULT_WHEEL_CONFIGURATION.prizes.map((prize, index) => (
      index === 0 ? { ...prize, probability: 0 } : { ...prize, active: false, probability: 0 }
    )),
  };

  assert.equal(wheelConfigurationSchema.safeParse(configuration).success, false);
});
