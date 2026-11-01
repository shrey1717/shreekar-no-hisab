import test from "node:test";
import assert from "node:assert/strict";

type MonthBreakdown = {
  monthNumber: number;
  monthKey: string;
  monthName: string;
  totalMinor: number;
  totalAmount: number;
  count: number;
};

function calculate12MonthMatrix(
  year: number,
  entries: Array<{ date: string; amountMinor: number }>
): MonthBreakdown[] {
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const map = new Map<number, { totalMinor: number; count: number }>();
  for (const entry of entries) {
    const entryDate = new Date(`${entry.date}T00:00:00`);
    if (entryDate.getFullYear() === year) {
      const monthNum = entryDate.getMonth() + 1;
      const prev = map.get(monthNum) || { totalMinor: 0, count: 0 };
      map.set(monthNum, {
        totalMinor: prev.totalMinor + entry.amountMinor,
        count: prev.count + 1,
      });
    }
  }

  return Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthStr = String(monthNum).padStart(2, "0");
    const monthKey = `${year}-${monthStr}`;
    const data = map.get(monthNum) || { totalMinor: 0, count: 0 };
    return {
      monthNumber: monthNum,
      monthKey,
      monthName: monthNames[i],
      totalMinor: data.totalMinor,
      totalAmount: data.totalMinor / 100,
      count: data.count,
    };
  });
}

test("12-month matrix computes monthwise amounts and counts correctly", () => {
  const mockEntries = [
    { date: "2026-01-15", amountMinor: 50000 }, // 500 in Jan
    { date: "2026-01-20", amountMinor: 25000 }, // 250 in Jan
    { date: "2026-03-05", amountMinor: 120000 }, // 1200 in Mar
    { date: "2026-10-11", amountMinor: 35000 }, // 350 in Oct
    { date: "2025-05-01", amountMinor: 99999 }, // Different year
  ];

  const breakdown = calculate12MonthMatrix(2026, mockEntries);

  assert.equal(breakdown.length, 12);
  assert.equal(breakdown[0].monthName, "Jan");
  assert.equal(breakdown[0].totalAmount, 750);
  assert.equal(breakdown[0].count, 2);

  assert.equal(breakdown[1].monthName, "Feb");
  assert.equal(breakdown[1].totalAmount, 0);
  assert.equal(breakdown[1].count, 0);

  assert.equal(breakdown[2].monthName, "Mar");
  assert.equal(breakdown[2].totalAmount, 1200);
  assert.equal(breakdown[2].count, 1);

  assert.equal(breakdown[9].monthName, "Oct");
  assert.equal(breakdown[9].totalAmount, 350);
  assert.equal(breakdown[9].count, 1);

  // Total for the year
  const total = breakdown.reduce((sum, m) => sum + m.totalAmount, 0);
  assert.equal(total, 2300);
});

test("account ledger calculates balance for given and received entries", () => {
  const entries: Array<{ amount: number; direction: "gave" | "got" }> = [
    { amount: 500, direction: "gave" },
    { amount: 200, direction: "got" },
    { amount: 150, direction: "gave" },
  ];

  const balance = entries.reduce(
    (tot, e) => tot + (e.direction === "gave" ? e.amount : -e.amount),
    0
  );

  // Gave 500 + 150 = 650, Got 200 => net balance = 450
  assert.equal(balance, 450);
});
