import assert from "node:assert/strict";
import test from "node:test";
import { calculateSettlementSuggestions } from "./balance-calculation";

test("settlement suggestions match debtors and creditors", () => {
  const suggestions = calculateSettlementSuggestions([
    { userId: "alice", name: "Alice", netMinor: BigInt(700) },
    { userId: "bob", name: "Bob", netMinor: -BigInt(500) },
    { userId: "cara", name: "Cara", netMinor: -BigInt(200) },
  ]);

  assert.deepEqual(suggestions, [
    {
      fromUserId: "bob",
      fromName: "Bob",
      toUserId: "alice",
      toName: "Alice",
      amountMinor: BigInt(500),
    },
    {
      fromUserId: "cara",
      fromName: "Cara",
      toUserId: "alice",
      toName: "Alice",
      amountMinor: BigInt(200),
    },
  ]);
});

test("zero balances do not produce suggestions", () => {
  assert.deepEqual(
    calculateSettlementSuggestions([
      { userId: "alice", name: "Alice", netMinor: BigInt(0) },
      { userId: "bob", name: "Bob", netMinor: BigInt(0) },
    ]),
    [],
  );
});
