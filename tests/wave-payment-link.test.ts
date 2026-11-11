import assert from "node:assert/strict";
import test from "node:test";
import { withCoteDIvoireWaveAmount } from "../client/src/lib/wave-payment-link";

test("adds the selected amount to a Côte d’Ivoire Wave link", () => {
  const result = withCoteDIvoireWaveAmount(
    "https://pay.wave.com/m/M_ci_test_merchant/c/ci/",
    5000,
    "CI",
  );

  assert.equal(
    result,
    "https://pay.wave.com/m/M_ci_test_merchant/c/ci/?amount=5000",
  );
});

test("replaces an existing amount and preserves the merchant path and other parameters", () => {
  const result = withCoteDIvoireWaveAmount(
    "https://pay.wave.com/m/M_ci_merchant/c/ci/?amount=700&source=account&campaign=summer#payment",
    5000,
    "CI",
  );
  const url = new URL(result!);

  assert.equal(url.pathname, "/m/M_ci_merchant/c/ci/");
  assert.equal(url.searchParams.get("amount"), "5000");
  assert.equal(url.searchParams.get("source"), "account");
  assert.equal(url.searchParams.get("campaign"), "summer");
  assert.equal(url.hash, "#payment");
});

test("leaves links outside pay.wave.com unchanged", () => {
  const link = "https://checkout.example.com/pay?amount=700&source=account";

  assert.equal(withCoteDIvoireWaveAmount(link, 5000, "CI"), link);
});

test("leaves Wave links for other countries unchanged", () => {
  const link = "https://pay.wave.com/m/M_ci_merchant/c/ci/?amount=700&source=account";

  assert.equal(withCoteDIvoireWaveAmount(link, 5000, "BF"), link);
});

test("leaves invalid amounts and non-HTTPS Wave URLs unchanged", () => {
  const link = "http://pay.wave.com/m/M_ci_merchant/c/ci/";

  assert.equal(withCoteDIvoireWaveAmount(link, 5000, "CI"), link);
  assert.equal(withCoteDIvoireWaveAmount("https://pay.wave.com/m/M_ci_merchant/c/ci/", 0, "CI"),
    "https://pay.wave.com/m/M_ci_merchant/c/ci/");
});
