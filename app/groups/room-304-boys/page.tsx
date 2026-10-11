"use client";

import Link from "next/link";
import { useState } from "react";

const members = [
  { initials: "SV", name: "You", role: "Admin", balance: "+₹1,240", color: "bg-[var(--primary)] text-white" },
  { initials: "RV", name: "Rahul Verma", role: "Member", balance: "+₹820", color: "bg-[#d9e7df] text-[#30644c]" },
  { initials: "AK", name: "Aman Kumar", role: "Member", balance: "+₹480", color: "bg-[#f8dfb5] text-[#805d24]" },
  { initials: "PK", name: "Prakash", role: "Member", balance: "+₹300", color: "bg-[#dedcf0] text-[#5a537e]" },
];

const activity = [
  { icon: "🍜", title: "Mess dinner", by: "Rahul paid · split equally", amount: "₹240", date: "Today" },
  { icon: "🧹", title: "Room cleaning", by: "You paid · split equally", amount: "₹180", date: "Yesterday" },
  { icon: "🛒", title: "Monthly groceries", by: "Aman paid · custom split", amount: "₹1,240", date: "Oct 08" },
];

export default function GroupDetails() {
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  function copyCode() {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] pb-10">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Back to dashboard" className="flex size-10 items-center justify-center rounded-full text-xl text-[var(--charcoal)] transition hover:bg-[var(--surface-card)]">←</Link>
          <div>
            <p className="text-lg font-extrabold tracking-tight">Group details</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">PaisaNakhne</p>
          </div>
        </div>
        <button type="button" aria-label="Open group menu" className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-card)] text-lg font-extrabold shadow-sm ring-1 ring-[var(--border-subtle)]">•••</button>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <section aria-labelledby="group-heading" className="relative overflow-hidden rounded-[1.75rem] bg-[var(--surface-card)] p-6 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-8">
            <div className="absolute -right-9 -top-9 size-32 rounded-full bg-[var(--accent-yellow-light)]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--status-owe-bg)] text-2xl">🏠</div>
                  <div>
                    <h1 id="group-heading" className="text-xl font-extrabold tracking-tight">Room 304 Boys</h1>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]"><span className="size-1.5 rounded-full bg-[var(--status-receive)]" />4 active members</p>
                  </div>
                </div>
                <button type="button" onClick={copyCode} className="rounded-lg bg-[var(--surface-cream)] px-3 py-2 text-xs font-extrabold text-[var(--charcoal)]">
                  {copied ? "Copied!" : "RM304-X7"}
                </button>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[var(--charcoal)] p-4 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/55">Group spend</p>
                  <p className="mt-2 text-2xl font-extrabold">₹4,820</p>
                  <p className="mt-1 text-xs text-white/50">This month</p>
                </div>
                <div className="rounded-2xl bg-[var(--status-receive-bg)] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Expenses</p>
                  <p className="mt-2 text-2xl font-extrabold text-[var(--status-receive)]">18</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">This month</p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Link href="/add-expense" className="flex-1 rounded-full bg-[var(--primary)] py-3 text-center text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(240,93,72,0.2)]">Add expense</Link>
                <button type="button" className="rounded-full border border-[var(--border-subtle)] px-4 py-3 text-sm font-extrabold text-[var(--charcoal)]">Invite</button>
              </div>
            </div>
          </section>

          <section aria-labelledby="members-heading" className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">People</p>
                <h2 id="members-heading" className="mt-1 text-xl font-extrabold">Group members</h2>
              </div>
              <span className="rounded-full bg-[var(--surface-cream)] px-2.5 py-1 text-xs font-bold text-[var(--text-secondary)]">4 total</span>
            </div>
            <div className="mt-5 space-y-3">
              {members.map((member) => (
                <div key={member.initials} className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-full text-xs font-extrabold ${member.color}`}>{member.initials}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{member.name}</p><p className="mt-0.5 text-xs text-[var(--text-secondary)]">{member.role}</p></div>
                  <span className="text-sm font-extrabold text-[var(--status-receive)]">{member.balance}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section aria-labelledby="activity-heading" className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Ledger</p>
              <h2 id="activity-heading" className="mt-1 text-xl font-extrabold">Group activity</h2>
            </div>
            <button type="button" onClick={() => setShowAll(!showAll)} className="rounded px-1 text-sm font-bold text-[var(--primary)]">{showAll ? "Collapse" : "See all"}</button>
          </div>
          <div className="mt-5 space-y-3">
            {(showAll ? [...activity, { icon: "☕", title: "Tea & snacks", by: "Prakash paid · split equally", amount: "₹120", date: "Oct 06" }] : activity).map((item) => (
              <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] p-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-cream)] text-lg">{item.icon}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{item.title}</p><p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{item.by}</p></div>
                <div className="text-right"><p className="text-sm font-extrabold">{item.amount}</p><p className="mt-1 text-[11px] font-semibold text-[var(--text-secondary)]">{item.date}</p></div>
              </div>
            ))}
          </div>
          <Link href="/balances" className="mt-5 block rounded-full border border-[var(--border-subtle)] py-3 text-center text-sm font-extrabold text-[var(--charcoal)]">View group balances</Link>
        </section>
      </div>
    </main>
  );
}
