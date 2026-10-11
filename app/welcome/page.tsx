"use client";

import Link from "next/link";
import { useState } from "react";

export default function Welcome() {
  const [joined, setJoined] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8 sm:flex sm:items-center sm:justify-center">
      <section className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" aria-label="Back to dashboard" className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-card)] text-xl text-[var(--charcoal)] shadow-sm">←</Link>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Step 1 of 1</span>
        </div>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--primary)] text-xl font-extrabold text-white">₹</div>
          <span className="text-lg font-extrabold tracking-tight">PaisaNakhne</span>
        </div>
        <section className="overflow-hidden rounded-[2rem] bg-[var(--charcoal)] p-6 text-white shadow-[0_20px_50px_rgba(30,30,36,0.16)] sm:p-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">You’re invited to</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">Room 304<br />Boys</h1>
            </div>
            <span className="text-6xl">🏠</span>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-bold">4 hostel mates</p>
            <p className="mt-1 text-xs leading-5 text-white/60">Track shared expenses, settle up easily, and keep hostel money conversations friendly.</p>
            <span className="mt-3 inline-flex rounded-full bg-[var(--status-receive)]/20 px-2.5 py-1 text-[11px] font-bold text-[var(--status-receive)]">All settled this week</span>
          </div>
        </section>
        <section className="mt-5 rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Join your friends</p>
          <h2 className="mt-1 text-xl font-extrabold">Make every rupee clear.</h2>
          <label htmlFor="phone" className="mt-5 block text-xs font-bold text-[var(--text-secondary)]">Mobile number</label>
          <div className="mt-2 flex rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] focus-within:border-[var(--primary)]">
            <span className="flex items-center border-r border-[var(--border-subtle)] px-3 text-sm font-bold text-[var(--text-secondary)]">+91</span>
            <input id="phone" inputMode="tel" placeholder="98765 43210" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold outline-none" />
          </div>
          {joined && <p role="status" className="mt-3 text-sm font-bold text-[var(--status-receive)]">Invite accepted. Welcome to Room 304!</p>}
          <button type="button" onClick={() => setJoined(true)} className="mt-5 w-full rounded-full bg-[var(--primary)] py-3.5 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(240,93,72,0.24)]">Get OTP &amp; join room</button>
          <div className="my-5 flex items-center gap-3 text-xs font-semibold text-[var(--text-secondary)]"><span className="h-px flex-1 bg-[var(--border-subtle)]" />or<span className="h-px flex-1 bg-[var(--border-subtle)]" /></div>
          <button type="button" className="w-full rounded-full border border-[var(--border-subtle)] bg-[var(--surface-cream)] py-3 text-sm font-extrabold text-[var(--charcoal)]">Continue with Google</button>
        </section>
      </section>
    </main>
  );
}
