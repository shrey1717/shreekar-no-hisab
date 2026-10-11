"use client";

import Link from "next/link";
import { useState } from "react";

export default function SettlementSuccess() {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(0);
  const reference = "429810482910";

  async function copyReference() {
    await navigator.clipboard?.writeText(reference);
    setCopied(true);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8 sm:flex sm:items-center sm:justify-center">
      <section className="mx-auto w-full max-w-md">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/balances" aria-label="Back to balances" className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-card)] text-xl text-[var(--charcoal)] shadow-sm">←</Link>
          <p className="text-lg font-extrabold">Settle up</p>
          <span className="size-10" />
        </header>
        <section className="rounded-[2rem] bg-[var(--surface-card)] p-6 text-center shadow-[0_14px_36px_rgba(75,52,45,0.07)] sm:p-8">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[var(--status-receive-bg)] text-4xl text-[var(--status-receive)]">✓</div>
          <span className="mt-5 inline-flex rounded-full bg-[var(--status-receive-bg)] px-3 py-1 text-xs font-bold text-[var(--status-receive)]">Payment confirmed</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em]">₹820.00</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Paid to <strong className="text-[var(--charcoal)]">Rahul Verma</strong></p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Goa Trip Fuel Split · Today, 10:42 PM</p>
          <div className="mt-6 rounded-2xl bg-[var(--surface-cream)] p-4 text-left">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Payment proof details</p>
            <div className="mt-4 flex items-center justify-between text-sm"><span className="text-[var(--text-secondary)]">UTR / Ref ID</span><button type="button" onClick={copyReference} className="font-bold text-[var(--charcoal)] underline underline-offset-2">{copied ? "Copied!" : reference}</button></div>
            <div className="mt-3 flex items-center justify-between text-sm"><span className="text-[var(--text-secondary)]">Payment method</span><span className="font-bold">UPI</span></div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[var(--border-subtle)] pt-5 text-sm"><span className="text-[var(--text-secondary)]">Your new balance</span><span className="font-extrabold text-[var(--status-receive)]">+₹2,450</span></div>
        </section>
        <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey Rahul, I just cleared ₹820 on PaisaNakhne! Ref: ${reference}`)}`} target="_blank" rel="noopener noreferrer" className="mt-4 block w-full rounded-2xl bg-[var(--status-receive-bg)] py-3.5 text-center text-sm font-extrabold text-[var(--status-receive)]">Share WhatsApp receipt</a>
        <Link href="/balances" className="mt-3 block w-full rounded-2xl bg-[var(--primary)] py-3.5 text-center text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(240,93,72,0.2)]">Back to balances</Link>
        <section className="mt-6 text-center">
          <p className="text-sm font-bold">How was settling up?</p>
          <div className="mt-3 flex justify-center gap-2" aria-label="Rate settlement experience">
            {[1, 2, 3, 4, 5].map((value) => <button type="button" aria-label={`${value} star${value === 1 ? "" : "s"}`} key={value} onClick={() => setRating(value)} className={`flex size-10 items-center justify-center rounded-full text-lg transition ${value <= rating ? "bg-[var(--secondary)]" : "bg-[var(--surface-card)]"}`}>★</button>)}
          </div>
          {rating > 0 && <p role="status" className="mt-2 text-xs font-bold text-[var(--status-receive)]">Thanks for the feedback!</p>}
        </section>
      </section>
    </main>
  );
}
