export type BalanceEntry = {
  userId: string;
  name: string;
  netMinor: bigint;
};

export type SettlementSuggestion = {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amountMinor: bigint;
};

export function calculateSettlementSuggestions(
  balances: BalanceEntry[],
): SettlementSuggestion[] {
  const creditors = balances
    .filter((balance) => balance.netMinor > BigInt(0))
    .map((balance) => ({ ...balance }));
  const debtors = balances
    .filter((balance) => balance.netMinor < BigInt(0))
    .map((balance) => ({ ...balance, netMinor: -balance.netMinor }));
  const suggestions: SettlementSuggestion[] = [];

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amount = creditor.netMinor < debtor.netMinor
      ? creditor.netMinor
      : debtor.netMinor;

    suggestions.push({
      fromUserId: debtor.userId,
      fromName: debtor.name,
      toUserId: creditor.userId,
      toName: creditor.name,
      amountMinor: amount,
    });

    creditor.netMinor -= amount;
    debtor.netMinor -= amount;

    if (creditor.netMinor === BigInt(0)) creditorIndex += 1;
    if (debtor.netMinor === BigInt(0)) debtorIndex += 1;
  }

  return suggestions;
}
