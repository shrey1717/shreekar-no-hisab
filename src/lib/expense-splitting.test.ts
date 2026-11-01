import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateEqualSplits,
  validateCustomSplits,
} from "./expense-splitting";

test("equal splits assign remainder minor units deterministically", () => {
  assert.deepEqual(
    calculateEqualSplits(BigInt(10001), ["a", "b", "c"]).map((split) => split.shareMinor),
    [BigInt(3334), BigInt(3334), BigInt(3333)],
  );
});

test("custom splits accept an exact total", () => {
  assert.doesNotThrow(() => validateCustomSplits(BigInt(100), [
    { userId: "a", shareMinor: BigInt(40) },
    { userId: "b", shareMinor: BigInt(60) },
  ]));
});

test("custom splits reject a mismatched total", () => {
  assert.throws(
    () => validateCustomSplits(BigInt(100), [{ userId: "a", shareMinor: BigInt(99) }]),
    /must equal/,
  );
});
