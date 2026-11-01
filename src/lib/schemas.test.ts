import assert from "node:assert/strict";
import test from "node:test";
import { createExpenseSchema } from "./expense-schemas";
import { createSettlementSchema } from "./settlement-schemas";

const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";

test("expense schema requires participants for equal splits", () => {
  const result = createExpenseSchema.safeParse({
    title: "Dinner",
    amountMinor: "1000",
    payerId: alice,
    splitType: "equal",
    expenseDate: "2026-11-01",
  });
  assert.equal(result.success, false);
});

test("expense schema accepts a valid custom split", () => {
  const result = createExpenseSchema.safeParse({
    title: "Dinner",
    amountMinor: "1000",
    payerId: alice,
    splits: [{ userId: alice, shareMinor: "500" }, { userId: bob, shareMinor: "500" }],
    splitType: "custom",
    expenseDate: "2026-11-01",
  });
  assert.equal(result.success, true);
});

test("settlement schema rejects non-positive amounts", () => {
  const result = createSettlementSchema.safeParse({
    fromUserId: alice,
    toUserId: bob,
    amountMinor: "0",
  });
  assert.equal(result.success, false);
});
