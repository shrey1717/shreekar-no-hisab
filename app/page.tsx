"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type Section = "expenses" | "accounts" | "split";
type Category = "Food" | "Stationery" | "Travel" | "Shopping" | "Bills";

type Expense = {
  id: number;
  title: string;
  category: Category;
  amount: number;
  date: string;
  icon: string;
};

const categoryStyles: Record<Category, { icon: string; background: string }> = {
  Food: { icon: "🍜", background: "bg-[var(--status-owe-bg)]" },
  Stationery: { icon: "✏️", background: "bg-[var(--accent-yellow-light)]" },
  Travel: { icon: "🚌", background: "bg-[#e9e8f7]" },
  Shopping: { icon: "🛒", background: "bg-[var(--status-receive-bg)]" },
  Bills: { icon: "💡", background: "bg-[#e8f0f8]" },
};

const initialExpenses: Expense[] = [
  { id: 1, title: "Mess dinner", category: "Food", amount: 240, date: "2026-10-11", icon: "🍜" },
  { id: 2, title: "Notebook & pens", category: "Stationery", amount: 180, date: "2026-10-10", icon: "✏️" },
  { id: 3, title: "Auto to college", category: "Travel", amount: 120, date: "2026-10-08", icon: "🚌" },
  { id: 4, title: "Monthly groceries", category: "Shopping", amount: 1240, date: "2026-09-28", icon: "🛒" },
  { id: 5, title: "Electricity share", category: "Bills", amount: 860, date: "2026-09-05", icon: "💡" },
];

const initialAccounts = [
  { id: 1, name: "Rahul Verma", type: "customer", amount: 820 },
  { id: 2, name: "Aman Kumar", type: "customer", amount: 480 },
  { id: 3, name: "Sharma Stationers", type: "supplier", amount: 1250 },
];

const initialGroups = [
  { id: 1, name: "Room 304 Boys", members: 4, total: 4820, color: "bg-[var(--status-owe-bg)]" },
  { id: 2, name: "Goa Trip", members: 6, total: 12840, color: "bg-[var(--accent-yellow-light)]" },
];

function formatMoney(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(`${date}T00:00:00`));
}

export default function Home() {
  const [section, setSection] = useState<Section>("expenses");
  const [expenses, setExpenses] = useState(initialExpenses);
  const [month, setMonth] = useState("2026-10");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<Category>("Food");
  const [expenseDate, setExpenseDate] = useState("2026-10-11");
  const [accounts, setAccounts] = useState(initialAccounts);
  const [accountName, setAccountName] = useState("");
  const [accountAmount, setAccountAmount] = useState("");
  const [accountType, setAccountType] = useState<"customer" | "supplier">("customer");
  const [groups, setGroups] = useState(initialGroups);
  const [groupName, setGroupName] = useState("");

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.startsWith(month)),
    [expenses, month],
  );
  const monthTotal = monthExpenses.reduce((total, expense) => total + expense.amount, 0);
  const customerTotal = accounts.filter((account) => account.type === "customer").reduce((total, account) => total + account.amount, 0);
  const supplierTotal = accounts.filter((account) => account.type === "supplier").reduce((total, account) => total + account.amount, 0);
  const groupedExpenses = monthExpenses.reduce<Record<string, Expense[]>>((result, expense) => {
    (result[expense.date] ??= []).push(expense);
    return result;
  }, {});

  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(expenseAmount);
    if (!expenseTitle.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setExpenses((current) => [
      { id: Date.now(), title: expenseTitle.trim(), category: expenseCategory, amount, date: expenseDate, icon: categoryStyles[expenseCategory].icon },
      ...current,
    ]);
    setExpenseTitle("");
    setExpenseAmount("");
    setShowExpenseForm(false);
  }

  function addAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(accountAmount);
    if (!accountName.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setAccounts((current) => [...current, { id: Date.now(), name: accountName.trim(), type: accountType, amount }]);
    setAccountName("");
    setAccountAmount("");
  }

  function addGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!groupName.trim()) return;
    setGroups((current) => [...current, { id: Date.now(), name: groupName.trim(), members: 1, total: 0, color: "bg-[#e9e8f7]" }]);
    setGroupName("");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] pb-10 text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex h-20 items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--primary)] text-xl font-extrabold text-white shadow-[0_8px_16px_rgba(240,93,72,0.2)]">₹</div>
            <div>
              <p className="text-base font-extrabold tracking-tight">PaisaNakhne</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]"><span className="size-1.5 rounded-full bg-[var(--status-receive)]" />Personal workspace</p>
            </div>
          </div>
          <button aria-label="Open profile" className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-card)] text-sm font-extrabold text-[var(--primary)] shadow-sm ring-1 ring-[var(--border-subtle)]">SV</button>
        </header>

        <div className="px-5 sm:px-8">
          <div className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1.5 shadow-sm">
            <nav aria-label="Workspace sections" className="grid grid-cols-3 gap-1">
              {([
                ["expenses", "Expenses", "◫"],
                ["accounts", "Accounts", "◎"],
                ["split", "Split", "⊕"],
              ] as const).map(([value, label, icon]) => (
                <button key={value} type="button" onClick={() => setSection(value)} className={`rounded-xl px-2 py-3 text-center text-xs font-extrabold transition sm:text-sm ${section === value ? "bg-[var(--charcoal)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-[var(--surface-cream)]"}`}>
                  <span className="mr-1.5 text-base">{icon}</span>{label}
                </button>
              ))}
            </nav>
          </div>

          {section === "expenses" && (
            <section aria-labelledby="expenses-heading" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div className="rounded-[1.75rem] bg-[var(--charcoal)] p-6 text-white shadow-[0_18px_40px_rgba(30,30,36,0.15)] sm:p-8">
                  <div className="flex items-start justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">Monthly expense overview</p><h1 id="expenses-heading" className="mt-2 text-4xl font-extrabold tracking-[-0.04em]">{formatMoney(monthTotal)}</h1><p className="mt-2 text-sm text-white/55">{monthExpenses.length} expenses recorded</p></div>
                    <select value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Choose expense month" className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white outline-none"><option className="text-black" value="2026-10">October 2026</option><option className="text-black" value="2026-09">September 2026</option></select>
                  </div>
                  <div className="mt-7 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-xs"><span className="text-white/55">Food <strong className="block pt-1 text-sm text-white">{formatMoney(monthExpenses.filter((item) => item.category === "Food").reduce((sum, item) => sum + item.amount, 0))}</strong></span><span className="text-white/55">Travel <strong className="block pt-1 text-sm text-white">{formatMoney(monthExpenses.filter((item) => item.category === "Travel").reduce((sum, item) => sum + item.amount, 0))}</strong></span><span className="text-white/55">Other <strong className="block pt-1 text-sm text-white">{formatMoney(monthExpenses.filter((item) => !["Food", "Travel"].includes(item.category)).reduce((sum, item) => sum + item.amount, 0))}</strong></span></div>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6">
                  <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Daily ledger</p><h2 className="mt-1 text-xl font-extrabold">Expenses by day</h2></div><button type="button" onClick={() => setShowExpenseForm((current) => !current)} className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-extrabold text-white">+ Add</button></div>
                  {showExpenseForm && <form onSubmit={addExpense} className="mb-5 rounded-2xl bg-[var(--surface-cream)] p-4"><div className="grid gap-3 sm:grid-cols-2"><input required value={expenseTitle} onChange={(event) => setExpenseTitle(event.target.value)} placeholder="Expense title" className="rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--primary)]" /><input required min="1" type="number" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} placeholder="Amount ₹" className="rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--primary)]" /><select value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value as Category)} className="rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-3 text-sm font-semibold outline-none"><option>Food</option><option>Stationery</option><option>Travel</option><option>Shopping</option><option>Bills</option></select><input required type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} className="rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-3 text-sm font-semibold outline-none" /></div><button className="mt-3 w-full rounded-xl bg-[var(--charcoal)] py-3 text-sm font-extrabold text-white">Save expense</button></form>}
                  <div className="space-y-5">{Object.entries(groupedExpenses).length === 0 && <p className="rounded-xl bg-[var(--surface-cream)] p-4 text-sm text-[var(--text-secondary)]">No expenses recorded for this month.</p>}{Object.entries(groupedExpenses).map(([date, items]) => <div key={date}><p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">{formatDate(date)} · {items.length} entries</p><div className="space-y-2">{items.map((expense) => <div key={expense.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] p-3"><div className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-lg ${categoryStyles[expense.category].background}`}>{expense.icon}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{expense.title}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{expense.category}</p></div><p className="text-sm font-extrabold">{formatMoney(expense.amount)}</p></div>)}</div></div>)}</div>
                </div>
              </div>
              <aside className="space-y-5"><div className="rounded-[1.5rem] bg-[var(--surface-card)] p-6 shadow-[0_10px_30px_rgba(75,52,45,0.05)]"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Quick actions</p><h2 className="mt-1 text-xl font-extrabold">Stay on top of spending</h2><div className="mt-5 space-y-3">{(["Food", "Stationery", "Travel", "Shopping"] as Category[]).map((category) => <div key={category} className="flex items-center gap-3"><span className={`flex size-9 items-center justify-center rounded-xl ${categoryStyles[category].background}`}>{categoryStyles[category].icon}</span><span className="flex-1 text-sm font-bold">{category}</span><span className="text-sm font-extrabold">{formatMoney(monthExpenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0))}</span></div>)}</div></div><Link href="/groups/room-304-boys" className="block rounded-[1.5rem] bg-[var(--accent-yellow-light)] p-5"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Shared expenses</p><p className="mt-1 text-lg font-extrabold">Room 304 Boys</p><p className="mt-2 text-sm text-[var(--text-secondary)]">View group activity and balances →</p></Link></aside>
            </section>
          )}

          {section === "accounts" && (
            <section aria-labelledby="accounts-heading" className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-5"><div className="rounded-[1.75rem] bg-[var(--charcoal)] p-6 text-white shadow-[0_18px_40px_rgba(30,30,36,0.15)] sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">Account overview</p><h1 id="accounts-heading" className="mt-2 text-4xl font-extrabold tracking-[-0.04em]">{formatMoney(customerTotal - supplierTotal)}</h1><p className="mt-2 text-sm text-white/55">Net money to collect from accounts</p><div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-4"><div><p className="text-xs text-white/55">Customers owe you</p><p className="mt-1 font-extrabold text-[var(--secondary)]">{formatMoney(customerTotal)}</p></div><div><p className="text-xs text-white/55">You get from suppliers</p><p className="mt-1 font-extrabold text-[var(--status-receive)]">{formatMoney(supplierTotal)}</p></div></div></div><form onSubmit={addAccount} className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Add account entry</p><h2 className="mt-1 text-xl font-extrabold">Track a person or supplier</h2><input required value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="Name e.g. Rahul or Sharma Stationers" className="mt-4 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-3 text-sm outline-none focus:border-[var(--primary)]" /><div className="mt-3 grid grid-cols-2 gap-2"><select value={accountType} onChange={(event) => setAccountType(event.target.value as "customer" | "supplier")} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-3 text-sm font-semibold"><option value="customer">Customer owes me</option><option value="supplier">Supplier gives me</option></select><input required min="1" type="number" value={accountAmount} onChange={(event) => setAccountAmount(event.target.value)} placeholder="Amount ₹" className="min-w-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-3 text-sm outline-none focus:border-[var(--primary)]" /></div><button className="mt-3 w-full rounded-xl bg-[var(--primary)] py-3 text-sm font-extrabold text-white">Add to accounts</button></form></div>
              <div className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">All accounts</p><h2 className="mt-1 text-xl font-extrabold">Customers &amp; suppliers</h2></div><span className="rounded-full bg-[var(--surface-cream)] px-3 py-1 text-xs font-bold">{accounts.length} people</span></div><div className="mt-5 grid gap-5 sm:grid-cols-2"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--status-receive)]">Customers · owe you</p><div className="space-y-2">{accounts.filter((account) => account.type === "customer").map((account) => <div key={account.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] p-3"><span className="flex size-10 items-center justify-center rounded-full bg-[var(--status-receive-bg)] text-xs font-extrabold text-[var(--status-receive)]">{account.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-sm font-extrabold">{account.name}</span><span className="text-sm font-extrabold text-[var(--status-receive)]">{formatMoney(account.amount)}</span></div>)}</div></div><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--primary)]">Suppliers · you get</p><div className="space-y-2">{accounts.filter((account) => account.type === "supplier").map((account) => <div key={account.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] p-3"><span className="flex size-10 items-center justify-center rounded-full bg-[var(--status-owe-bg)] text-xs font-extrabold text-[var(--primary)]">{account.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-sm font-extrabold">{account.name}</span><span className="text-sm font-extrabold text-[var(--primary)]">{formatMoney(account.amount)}</span></div>)}</div></div></div></div>
            </section>
          )}

          {section === "split" && (
            <section aria-labelledby="split-heading" className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-5"><div className="rounded-[1.75rem] bg-[var(--charcoal)] p-6 text-white shadow-[0_18px_40px_rgba(30,30,36,0.15)] sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">Friends workspace</p><h1 id="split-heading" className="mt-2 text-4xl font-extrabold tracking-[-0.04em]">Split fairly.</h1><p className="mt-3 max-w-sm text-sm leading-6 text-white/60">Create groups, add shared expenses, and let PaisaNakhne keep the math clear.</p><div className="mt-7 flex items-center gap-2 text-xs font-bold text-white/70"><span className="flex size-8 items-center justify-center rounded-full bg-[var(--primary)]">1</span> Create a group <span className="text-white/30">→</span><span className="flex size-8 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--charcoal)]">2</span> Add &amp; split</div></div><form onSubmit={addGroup} className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">New group</p><h2 className="mt-1 text-xl font-extrabold">Who are you splitting with?</h2><div className="mt-4 flex gap-2"><input required value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="e.g. Weekend trip" className="min-w-0 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3 py-3 text-sm outline-none focus:border-[var(--primary)]" /><button className="rounded-xl bg-[var(--primary)] px-4 text-sm font-extrabold text-white">Create</button></div></form></div>
              <div className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Your groups</p><h2 className="mt-1 text-xl font-extrabold">Shared expense groups</h2></div><span className="rounded-full bg-[var(--status-receive-bg)] px-3 py-1 text-xs font-bold text-[var(--status-receive)]">{groups.length} active</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{groups.map((group) => <Link key={group.id} href={group.name === "Room 304 Boys" ? "/groups/room-304-boys" : "/add-expense"} className="rounded-2xl border border-[var(--border-subtle)] p-4 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between"><span className={`flex size-11 items-center justify-center rounded-xl text-xl ${group.color}`}>👥</span><span className="text-xs font-bold text-[var(--text-secondary)]">{group.members} members</span></div><p className="mt-4 text-base font-extrabold">{group.name}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Total shared spend</p><p className="mt-2 text-lg font-extrabold">{formatMoney(group.total)}</p><span className="mt-4 block text-xs font-bold text-[var(--primary)]">Open group →</span></Link>)}</div></div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
