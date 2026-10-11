"use client";

import { FormEvent, useState } from "react";

type Direction = "gave" | "got";
type AccountType = "customer" | "supplier";
type AccountEntry = { id: number; amount: number; direction: Direction; date: string };
type Account = { id: number; name: string; type: AccountType; entries: AccountEntry[] };

function money(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function balance(account: Account) {
  return account.entries.reduce((total, entry) => total + (entry.direction === "gave" ? entry.amount : -entry.amount), 0);
}

export function AccountWorkspace({ accounts, setAccounts }: { accounts: Account[]; setAccounts: React.Dispatch<React.SetStateAction<Account[]>> }) {
  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<Direction>("gave");

  const people = accounts.filter((account) => account.type === accountType);
  const selected = accounts.find((account) => account.id === selectedId && account.type === accountType);
  const total = people.reduce((sum, account) => sum + Math.max(balance(account), 0), 0);

  function addPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const person = { id: Date.now(), name: trimmed, type: accountType, entries: [] };
    setAccounts((current) => [...current, person]);
    setName("");
    setShowAddPerson(false);
    setSelectedId(person.id);
  }

  function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!selected || !Number.isFinite(value) || value <= 0) return;
    setAccounts((current) => current.map((account) => account.id === selected.id
      ? { ...account, entries: [...account.entries, { id: Date.now(), amount: value, direction, date: "2026-10-11" }] }
      : account));
    setAmount("");
  }

  return (
    <section aria-labelledby="accounts-heading" className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-5">
        <div className="rounded-[1.75rem] bg-[var(--charcoal)] p-6 text-white shadow-[0_18px_40px_rgba(30,30,36,0.15)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">Account section</p>
          <h1 id="accounts-heading" className="mt-2 text-4xl font-extrabold tracking-[-0.04em]">{money(total)}</h1>
          <p className="mt-2 text-sm text-white/55">{accountType === "customer" ? "Customers owe you" : "Supplier balance to track"}</p>
        </div>
        <div className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-cream)] p-1">
            {(["customer", "supplier"] as AccountType[]).map((type) => (
              <button type="button" key={type} onClick={() => { setAccountType(type); setSelectedId(null); }} className={`rounded-lg py-3 text-sm font-extrabold capitalize ${accountType === type ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}>
                {type}s
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">{accountType}s</p><h2 className="mt-1 text-xl font-extrabold">Your {accountType}s</h2></div>
            <button type="button" onClick={() => setShowAddPerson((current) => !current)} className="rounded-full bg-[var(--primary)] px-3 py-2 text-xs font-extrabold text-white">+ Add {accountType}</button>
          </div>
          {showAddPerson && <form onSubmit={addPerson} className="mt-4 flex gap-2 rounded-2xl bg-[var(--surface-cream)] p-3"><input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder={`${accountType === "customer" ? "Customer" : "Supplier"} name`} className="min-w-0 flex-1 rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-3 text-sm outline-none" /><button className="rounded-xl bg-[var(--charcoal)] px-4 text-xs font-extrabold text-white">Add</button></form>}
          <div className="mt-5 space-y-2">
            {people.length === 0 && <p className="rounded-xl bg-[var(--surface-cream)] p-4 text-sm text-[var(--text-secondary)]">No {accountType}s yet. Add the first one above.</p>}
            {people.map((person) => {
              const currentBalance = balance(person);
              return <button type="button" key={person.id} onClick={() => setSelectedId(person.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${selectedId === person.id ? "border-[var(--primary)] bg-[var(--status-owe-bg)]" : "border-[var(--border-subtle)] hover:bg-[var(--surface-cream)]"}`}><span className="flex size-11 items-center justify-center rounded-full bg-[var(--surface-cream)] text-xs font-extrabold">{person.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold">{person.name}</span><span className="mt-1 block text-xs text-[var(--text-secondary)]">{person.entries.length} entries</span></span><span className={`text-sm font-extrabold ${currentBalance === 0 ? "text-[var(--status-receive)]" : "text-[var(--primary)]"}`}>{currentBalance === 0 ? "Settled up" : money(Math.abs(currentBalance))}</span><span className="text-[var(--text-secondary)]">›</span></button>;
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6">
        {!selected ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--accent-yellow-light)] text-3xl">◎</div><h2 className="mt-4 text-xl font-extrabold">Select a {accountType}</h2><p className="mt-2 max-w-xs text-sm leading-6 text-[var(--text-secondary)]">Click a person to view their entries and record money you gave or got.</p></div> : <><div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-5"><button type="button" onClick={() => setSelectedId(null)} className="text-xl text-[var(--text-secondary)] lg:hidden">←</button><span className="flex size-12 items-center justify-center rounded-full bg-[var(--status-owe-bg)] text-sm font-extrabold">{selected.name.slice(0, 2).toUpperCase()}</span><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">{accountType} ledger</p><h2 className="text-xl font-extrabold">{selected.name}</h2></div><span className={`ml-auto text-right text-sm font-extrabold ${balance(selected) === 0 ? "text-[var(--status-receive)]" : "text-[var(--primary)]"}`}>{balance(selected) === 0 ? "Settled up" : money(Math.abs(balance(selected)))}<small className="block text-[10px] text-[var(--text-secondary)]">{balance(selected) === 0 ? "All clear" : "outstanding"}</small></span></div><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setDirection("gave")} className={`rounded-xl py-3 text-sm font-extrabold ${direction === "gave" ? "bg-[var(--status-owe-bg)] text-[var(--primary)]" : "bg-[var(--surface-cream)] text-[var(--text-secondary)]"}`}>You gave</button><button type="button" onClick={() => setDirection("got")} className={`rounded-xl py-3 text-sm font-extrabold ${direction === "got" ? "bg-[var(--status-receive-bg)] text-[var(--status-receive)]" : "bg-[var(--surface-cream)] text-[var(--text-secondary)]"}`}>You got</button></div><form onSubmit={addEntry} className="mt-3 flex gap-2"><input required min="1" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount ₹" className="min-w-0 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-3 text-sm outline-none" /><button className="rounded-xl bg-[var(--charcoal)] px-4 text-xs font-extrabold text-white">Save entry</button></form><div className="mt-6"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Saved entries</p><div className="mt-3 space-y-2">{selected.entries.length === 0 && <p className="rounded-xl bg-[var(--surface-cream)] p-3 text-sm text-[var(--text-secondary)]">No entries yet.</p>}{selected.entries.map((entry) => <div key={entry.id} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] p-3 text-sm"><span className={entry.direction === "gave" ? "font-bold text-[var(--primary)]" : "font-bold text-[var(--status-receive)]"}>{entry.direction === "gave" ? "You gave" : "You got"}<small className="ml-2 font-normal text-[var(--text-secondary)]">11 Oct</small></span><span className="font-extrabold">{money(entry.amount)}</span></div>)}{balance(selected) === 0 && selected.entries.length > 0 && <p className="mt-3 rounded-xl bg-[var(--status-receive-bg)] p-3 text-sm font-bold text-[var(--status-receive)]">Settled up — no amount pending.</p>}</div></div></>}
      </div>
    </section>
  );
}
