export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-[2rem] bg-[var(--surface-card)] p-8 text-center shadow-[0_20px_60px_rgba(75,52,45,0.08)] sm:p-12">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-[var(--primary)] text-3xl font-extrabold text-white shadow-[0_10px_20px_rgba(240,93,72,0.22)]">
          ₹
        </div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
          HisabMate
        </p>
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-[var(--charcoal)] sm:text-4xl">
          Shared expenses, minus the awkwardness.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[var(--text-secondary)]">
          A warm, simple way for hostel friends and roommates to keep every
          rupee clear.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button className="rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--primary-dark)]">
            Get started
          </button>
          <button className="rounded-full border border-[var(--border-subtle)] px-6 py-3 text-sm font-bold text-[var(--charcoal)] transition hover:bg-[var(--surface-cream)]">
            View the demo
          </button>
        </div>
      </section>
    </main>
  );
}
