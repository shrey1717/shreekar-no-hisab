"use client";

import Link from "next/link";
import { useState } from "react";

const people: { initials: string; name: string; color: string }[] = [];

export default function AddExpense() {
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [participants, setParticipants] = useState<string[]>([]);

  function toggleParticipant(initials: string) {
    setParticipants((current) =>
      current.includes(initials)
        ? current.filter((person) => person !== initials)
        : [...current, initials],
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] pb-8">
      <header className="mx-auto flex h-20 w-full max-w-2xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back to dashboard"
            className="flex size-10 items-center justify-center rounded-full text-xl text-[var(--charcoal)] transition hover:bg-[var(--surface-card)]"
          >
            ←
          </Link>
          <div>
            <p className="text-lg font-extrabold tracking-tight">Add expense</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Your group
            </p>
          </div>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-card)] text-sm font-extrabold text-[var(--primary)] shadow-sm ring-1 ring-[var(--border-subtle)]">
          ?
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 sm:px-8">
        <div className="mb-5 flex items-center justify-between">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            <span className="size-1.5 rounded-full bg-[var(--status-receive)]" />
            New shared ledger entry
          </p>
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Today</span>
        </div>

        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <section className="relative overflow-hidden rounded-[1.75rem] bg-[var(--charcoal)] p-6 text-white shadow-[0_18px_40px_rgba(30,30,36,0.15)] sm:p-8">
            <div className="absolute -bottom-16 -right-10 size-40 rounded-full bg-[var(--secondary)]/20 blur-2xl" />
            <div className="relative">
              <label htmlFor="amount" className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">
                Amount spent
              </label>
              <div className="mt-4 flex items-center gap-2 border-b border-white/15 pb-3">
                <span className="text-3xl font-extrabold text-[var(--secondary)]">₹</span>
                <input
                  id="amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-full bg-transparent text-4xl font-extrabold tracking-[-0.04em] text-white outline-none placeholder:text-white/25"
                />
              </div>
              <label htmlFor="title" className="mt-6 block text-xs font-bold uppercase tracking-[0.12em] text-white/60">
                What was it for?
              </label>
              <input
                id="title"
                placeholder="e.g. Groceries, dinner..."
                className="mt-3 w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[var(--secondary)]"
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6">
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]" htmlFor="payer">
              Paid by
            </label>
            <select id="payer" defaultValue="" className="mt-3 w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-4 py-3 text-sm font-bold text-[var(--charcoal)] outline-none focus:border-[var(--primary)]">
              <option value="" disabled>Add a person first</option>
              {people.map((person) => <option key={person.initials} value={person.initials}>{person.name}</option>)}
            </select>
          </section>

          <section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Split between</p>
                <h2 className="mt-1 text-lg font-extrabold">Who was involved?</h2>
              </div>
              <span className="rounded-full bg-[var(--status-receive-bg)] px-2.5 py-1 text-xs font-bold text-[var(--status-receive)]">
                {participants.length} people
              </span>
            </div>
            {people.length === 0 ? <p className="mt-5 rounded-xl bg-[var(--surface-cream)] p-4 text-sm text-[var(--text-secondary)]">No people added yet. Add group members before splitting an expense.</p> : <div className="mt-5 grid grid-cols-4 gap-2">
              {people.map((person) => {
                const selected = participants.includes(person.initials);
                return (
                  <button type="button" key={person.initials} onClick={() => toggleParticipant(person.initials)} className="flex flex-col items-center gap-2">
                    <span className={`flex size-12 items-center justify-center rounded-full text-xs font-extrabold ring-2 ring-offset-2 transition ${person.color} ${selected ? "ring-[var(--primary)]" : "ring-transparent opacity-45"}`}>
                      {person.initials}
                    </span>
                    <span className={`text-xs font-bold ${selected ? "text-[var(--charcoal)]" : "text-[var(--text-secondary)]"}`}>{person.name}</span>
                  </button>
                );
              })}
            </div>}
          </section>

          <section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Split mode</p>
                <h2 className="mt-1 text-lg font-extrabold">How should it be split?</h2>
              </div>
              <span className="text-xl">⚖</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-cream)] p-1">
              {(["equal", "custom"] as const).map((mode) => (
                <button type="button" key={mode} onClick={() => setSplitMode(mode)} className={`rounded-lg py-2.5 text-sm font-extrabold capitalize transition ${splitMode === mode ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}>
                  {mode} split
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">
              {splitMode === "equal" ? "Everyone selected pays an equal share." : "Enter each person’s share before saving."}
            </p>
          </section>

          <button type="submit" className="w-full rounded-full bg-[var(--primary)] py-4 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(240,93,72,0.25)] transition hover:bg-[var(--primary-dark)]">
            Save expense
          </button>
        </form>
      </div>
    </main>
  );
}
