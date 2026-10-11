"use client";

import Link from "next/link";
import { useState } from "react";

const balances = [
  { initials: "RV", name: "Rahul Verma", detail: "for dinner & groceries", amount: "₹820", color: "bg-[#d9e7df] text-[#30644c]" },
  { initials: "AK", name: "Aman Kumar", detail: "for room cleaning", amount: "₹480", color: "bg-[#f8dfb5] text-[#805d24]" },
  { initials: "PK", name: "Prakash", detail: "for monthly supplies", amount: "₹300", color: "bg-[#dedcf0] text-[#5a537e]" },
];

export default function Balances() {
  const [settled, setSettled] = useState<string[]>([]);
  const remaining = balances.filter((person) => !settled.includes(person.initials));
  const activeTotal = remaining.reduce((sum, person) => sum + Number(person.amount.replace(/[₹,]/g, "")), 0);

  function markSettled(initials: string) {
    setSettled((current) => [...current, initials]);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] pb-10">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Back to dashboard" className="flex size-10 items-center justify-center rounded-full text-xl text-[var(--charcoal)] transition hover:bg-[var(--surface-card)]">←</Link>
          <div>
            <p className="text-lg font-extrabold tracking-tight">Balances</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Room 304 Boys</p>
          </div>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-card)] text-sm font-extrabold text-[var(--primary)] shadow-sm ring-1 ring-[var(--border-subtle)]">SV</div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <section aria-labelledby="balance-heading" className="relative overflow-hidden rounded-[1.75rem] bg-[var(--charcoal)] p-6 text-white shadow-[0_18px_40px_rgba(30,30,36,0.15)] sm:p-8">
            <div className="absolute -bottom-12 -right-8 size-36 rounded-full bg-[var(--secondary)]/15" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[var(--status-receive)]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--status-receive)]">Net summary</span>
                <span className="text-xs font-semibold text-white/50">October</span>
              </div>
              <p id="balance-heading" className="mt-7 text-xs font-bold uppercase tracking-[0.12em] text-white/55">You should receive</p>
              <p className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">₹1,600</p>
              <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                <span className="text-white/60">You owe others</span>
                <span className="font-extrabold text-[var(--primary)]">₹360</span>
              </div>
            </div>
          </section>

          <section aria-labelledby="receivables-heading" className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Money coming in</p>
                <h1 id="receivables-heading" className="mt-1 text-xl font-extrabold">People who owe you</h1>
              </div>
              <span className="rounded-full bg-[var(--status-receive-bg)] px-2.5 py-1 text-xs font-bold text-[var(--status-receive)]">{remaining.length} active · ₹{activeTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="mt-5 space-y-3">
              {balances.map((person) => {
                const isSettled = settled.includes(person.initials);
                return (
                  <div key={person.initials} className={`flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] p-3 transition ${isSettled ? "opacity-55" : ""}`} aria-label={`${person.name}: ${isSettled ? "settled" : `${person.amount} owed`}`}>
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${person.color}`}>{person.initials}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-extrabold ${isSettled ? "line-through" : ""}`}>{person.name}</p>
                      <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{isSettled ? "Marked as settled" : person.detail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-[var(--status-receive)]">{isSettled ? "Done" : `+${person.amount}`}</p>
                      {!isSettled && <button type="button" onClick={() => markSettled(person.initials)} className="mt-1 rounded px-1 text-[11px] font-bold text-[var(--primary)] underline-offset-2 hover:underline">Mark settled</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section aria-labelledby="suggestion-heading" className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Suggested settle-up</p>
            <h2 id="suggestion-heading" className="mt-1 text-xl font-extrabold">Keep it simple</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">One payment can clear your biggest outstanding balance.</p>
            <div className="mt-5 rounded-2xl bg-[var(--accent-yellow-light)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-extrabold text-white">SV</div>
                <span className="text-[var(--text-secondary)]">→</span>
                <div className="flex size-10 items-center justify-center rounded-full bg-[#d9e7df] text-xs font-extrabold text-[#30644c]">RV</div>
                <div className="ml-auto text-right">
                  <p className="text-lg font-extrabold">₹360</p>
                  <p className="text-[11px] font-bold text-[var(--text-secondary)]">to Rahul</p>
                </div>
              </div>
              <Link href="/settlement-success" className="mt-4 block w-full rounded-full bg-[var(--charcoal)] py-3 text-center text-sm font-extrabold text-white transition hover:bg-black">Record repayment</Link>
            </div>
          </section>
          <section aria-label="Balance guidance" className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-transparent p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Good to know</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Balances change only when an expense or confirmed repayment is recorded.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
