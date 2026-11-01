"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/src/lib/api-client";

type Direction = "gave" | "got";
type AccountType = "customer" | "supplier";
export type AccountEntry = {
  id: string | number;
  amount: number;
  direction: Direction;
  date: string;
  notes?: string | null;
};
export type Account = {
  id: string | number;
  name: string;
  type: AccountType;
  phone?: string | null;
  entries: AccountEntry[];
};

function formatMoney(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${dateStr}T00:00:00`));
  } catch {
    return dateStr;
  }
}

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calcBalance(account: Account) {
  return account.entries.reduce(
    (total, entry) =>
      total + (entry.direction === "gave" ? entry.amount : -entry.amount),
    0
  );
}

export function AccountWorkspace({
  accounts: initialAccounts,
  setAccounts: setParentAccounts,
}: {
  accounts?: Account[];
  setAccounts?: React.Dispatch<React.SetStateAction<Account[]>>;
}) {
  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [accounts, setLocalAccounts] = useState<Account[]>(initialAccounts || []);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(getToday());
  const [direction, setDirection] = useState<Direction>("gave");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const syncAccounts = (newAccounts: Account[]) => {
    setLocalAccounts(newAccounts);
    if (setParentAccounts) {
      setParentAccounts(newAccounts);
    }
  };

  useEffect(() => {
    setLoading(true);
    apiRequest<{ accounts: Account[] }>("/api/accounts")
      .then((res) => {
        syncAccounts(res.accounts || []);
      })
      .catch((err) => {
        console.warn("Could not load accounts from DB:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const people = accounts.filter((account) => account.type === accountType);
  const selected = accounts.find(
    (account) => String(account.id) === String(selectedId) && account.type === accountType
  );
  const total = people.reduce(
    (sum, account) => sum + Math.max(calcBalance(account), 0),
    0
  );

  async function addPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await apiRequest<{ account: Account }>("/api/accounts", {
        method: "POST",
        body: JSON.stringify({
          name: trimmed,
          type: accountType,
          phone: phone.trim() || undefined,
        }),
      });

      const newAccount = res.account || {
        id: Date.now().toString(),
        name: trimmed,
        type: accountType,
        phone: phone.trim() || undefined,
        entries: [],
      };

      const updated = [...accounts, newAccount];
      syncAccounts(updated);
      setName("");
      setPhone("");
      setShowAddPerson(false);
      setSelectedId(newAccount.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
  }

  async function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!selected || !Number.isFinite(value) || value <= 0) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await apiRequest<{ entry: AccountEntry }>(
        `/api/accounts/${selected.id}/entries`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: value,
            direction,
            date: entryDate,
          }),
        }
      );

      const newEntry = res.entry || {
        id: Date.now().toString(),
        amount: value,
        direction,
        date: entryDate,
      };

      const updated = accounts.map((account) =>
        String(account.id) === String(selected.id)
          ? { ...account, entries: [newEntry, ...account.entries] }
          : account
      );

      syncAccounts(updated);
      setAmount("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save entry.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteAccount(id: string | number) {
    if (!confirm("Are you sure you want to delete this account ledger?")) return;
    try {
      await apiRequest(`/api/accounts/${id}`, { method: "DELETE" });
      const updated = accounts.filter((a) => String(a.id) !== String(id));
      syncAccounts(updated);
      if (String(selectedId) === String(id)) {
        setSelectedId(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete account.");
    }
  }

  return (
    <section aria-labelledby="accounts-heading" className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-5">
        <div className="rounded-[1.75rem] bg-[var(--charcoal)] p-6 text-white shadow-[0_18px_40px_rgba(30,30,36,0.15)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">
            {accountType === "customer" ? "Customer Ledger" : "Supplier Ledger"}
          </p>
          <h1 id="accounts-heading" className="mt-2 text-4xl font-extrabold tracking-[-0.04em]">
            {formatMoney(total)}
          </h1>
          <p className="mt-2 text-sm text-white/55">
            {accountType === "customer"
              ? "Total amount customers owe you"
              : "Total amount you owe to suppliers"}
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-cream)] p-1">
            {(["customer", "supplier"] as AccountType[]).map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => {
                  setAccountType(type);
                  setSelectedId(null);
                  setError("");
                }}
                className={`rounded-lg py-3 text-sm font-extrabold capitalize transition ${
                  accountType === type
                    ? "bg-white text-[var(--primary)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                {type}s
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                {accountType} list
              </p>
              <h2 className="mt-1 text-xl font-extrabold capitalize">
                Your {accountType}s
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPerson((current) => !current)}
              className="rounded-full bg-[var(--primary)] px-3 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[var(--primary-dark)]"
            >
              + Add {accountType}
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-xl bg-[var(--status-owe-bg)] p-3 text-xs font-bold text-[var(--primary)]">
              {error}
            </p>
          )}

          {showAddPerson && (
            <form onSubmit={addPerson} className="mt-4 space-y-2 rounded-2xl bg-[var(--surface-cream)] p-3">
              <input
                autoFocus
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={`${accountType === "customer" ? "Customer" : "Supplier"} name`}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number (optional)"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddPerson(false)}
                  className="rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="rounded-xl bg-[var(--charcoal)] px-4 py-2 text-xs font-extrabold text-white"
                >
                  {submitting ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-5 space-y-2">
            {loading ? (
              <p className="p-4 text-center text-xs text-[var(--text-secondary)]">Loading accounts...</p>
            ) : people.length === 0 ? (
              <p className="rounded-xl bg-[var(--surface-cream)] p-4 text-center text-sm text-[var(--text-secondary)]">
                No {accountType}s yet. Add one above to keep hisab.
              </p>
            ) : (
              people.map((person) => {
                const currentBalance = calcBalance(person);
                const isSelected = String(selectedId) === String(person.id);
                return (
                  <button
                    type="button"
                    key={person.id}
                    onClick={() => setSelectedId(person.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--status-owe-bg)]"
                        : "border-[var(--border-subtle)] hover:bg-[var(--surface-cream)]"
                    }`}
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-[var(--surface-cream)] text-xs font-extrabold">
                      {person.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">{person.name}</span>
                      <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">
                        {person.entries.length} entries {person.phone ? `· ${person.phone}` : ""}
                      </span>
                    </span>
                    <span
                      className={`text-sm font-extrabold ${
                        currentBalance === 0
                          ? "text-[var(--status-receive)]"
                          : currentBalance > 0
                          ? "text-[var(--primary)]"
                          : "text-[var(--status-receive)]"
                      }`}
                    >
                      {currentBalance === 0 ? "Settled up" : formatMoney(Math.abs(currentBalance))}
                    </span>
                    <span className="text-[var(--text-secondary)]">›</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6">
        {!selected ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--accent-yellow-light)] text-3xl">
              ◎
            </div>
            <h2 className="mt-4 text-xl font-extrabold">Select a {accountType}</h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--text-secondary)]">
              Click a {accountType} from the list to view full ledger history, record money you gave or got, or settle up.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-5">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-xl text-[var(--text-secondary)] lg:hidden"
              >
                ←
              </button>
              <span className="flex size-12 items-center justify-center rounded-full bg-[var(--status-owe-bg)] text-sm font-extrabold">
                {selected.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                  {accountType} ledger
                </p>
                <h2 className="text-xl font-extrabold">{selected.name}</h2>
                {selected.phone && <p className="text-xs text-[var(--text-secondary)]">{selected.phone}</p>}
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span
                  className={`text-right text-sm font-extrabold ${
                    calcBalance(selected) === 0
                      ? "text-[var(--status-receive)]"
                      : calcBalance(selected) > 0
                      ? "text-[var(--primary)]"
                      : "text-[var(--status-receive)]"
                  }`}
                >
                  {calcBalance(selected) === 0
                    ? "Settled up"
                    : `${calcBalance(selected) > 0 ? "₹" : "-₹"}${Math.abs(calcBalance(selected)).toLocaleString("en-IN")}`}
                  <small className="block text-[10px] text-[var(--text-secondary)]">
                    {calcBalance(selected) === 0
                      ? "All clear"
                      : calcBalance(selected) > 0
                      ? "outstanding"
                      : "advance / credit"}
                  </small>
                </span>
                <button
                  type="button"
                  title="Delete account"
                  onClick={() => deleteAccount(selected.id)}
                  className="rounded-lg p-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--status-owe-bg)] hover:text-[var(--primary)]"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("gave")}
                className={`rounded-xl py-3 text-sm font-extrabold transition ${
                  direction === "gave"
                    ? "bg-[var(--status-owe-bg)] text-[var(--primary)] shadow-sm"
                    : "bg-[var(--surface-cream)] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                You gave (-)
              </button>
              <button
                type="button"
                onClick={() => setDirection("got")}
                className={`rounded-xl py-3 text-sm font-extrabold transition ${
                  direction === "got"
                    ? "bg-[var(--status-receive-bg)] text-[var(--status-receive)] shadow-sm"
                    : "bg-[var(--surface-cream)] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                You got (+)
              </button>
            </div>

            <form onSubmit={addEntry} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input
                required
                min="1"
                step="any"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount ₹"
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-3 text-sm outline-none focus:border-[var(--primary)]"
              />
              <input
                required
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-3 text-sm font-semibold outline-none focus:border-[var(--primary)]"
              />
              <button
                disabled={submitting}
                className="rounded-xl bg-[var(--charcoal)] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-black disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save entry"}
              </button>
            </form>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                  Ledger statement ({selected.entries.length} entries)
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {selected.entries.length === 0 ? (
                  <p className="rounded-xl bg-[var(--surface-cream)] p-4 text-center text-sm text-[var(--text-secondary)]">
                    No entries recorded yet. Record the first transaction above.
                  </p>
                ) : (
                  selected.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] p-3 text-sm transition hover:bg-[var(--surface-cream)]"
                    >
                      <div>
                        <span
                          className={`font-bold ${
                            entry.direction === "gave"
                              ? "text-[var(--primary)]"
                              : "text-[var(--status-receive)]"
                          }`}
                        >
                          {entry.direction === "gave" ? "You gave" : "You got"}
                        </span>
                        <span className="ml-2 text-xs text-[var(--text-secondary)]">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      <span className="font-extrabold">{formatMoney(entry.amount)}</span>
                    </div>
                  ))
                )}
                {calcBalance(selected) === 0 && selected.entries.length > 0 && (
                  <p className="mt-3 rounded-xl bg-[var(--status-receive-bg)] p-3 text-center text-xs font-bold text-[var(--status-receive)]">
                    ✓ All settled up — no amount pending.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
