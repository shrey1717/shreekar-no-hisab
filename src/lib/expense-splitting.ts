export type ExpenseSplit = {
  userId: string;
  shareMinor: bigint;
};

export function calculateEqualSplits(
  amountMinor: bigint,
  participantIds: string[],
): ExpenseSplit[] {
  const base = amountMinor / BigInt(participantIds.length);
  const remainder = amountMinor % BigInt(participantIds.length);

  return participantIds.map((userId, index) => ({
    userId,
    shareMinor: base + (BigInt(index) < remainder ? BigInt(1) : BigInt(0)),
  }));
}

export function validateCustomSplits(
  amountMinor: bigint,
  splits: ExpenseSplit[],
): void {
  const total = splits.reduce((sum, split) => sum + split.shareMinor, BigInt(0));
  if (total !== amountMinor) {
    throw new Error("Custom expense splits must equal the expense amount.");
  }
}
