const expenses = [
  { icon: "🍜", title: "Mess dinner", meta: "Today · Rahul paid", amount: "₹240", tone: "coral" },
  { icon: "🧹", title: "Room cleaning", meta: "Yesterday · You paid", amount: "₹180", tone: "yellow" },
  { icon: "🛒", title: "Monthly groceries", meta: "Oct 08 · Aman paid", amount: "₹1,240", tone: "green" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] pb-24 text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex h-20 items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--primary)] text-xl font-extrabold text-white shadow-[0_8px_16px_rgba(240,93,72,0.2)]">
              ₹
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight">PaisaNakhne</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                <span className="size-1.5 rounded-full bg-[var(--status-receive)]" />
                Room 304 Boys
              </p>
            </div>
          </div>
          <button
            aria-label="Open profile"
            className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-card)] text-sm font-extrabold text-[var(--primary)] shadow-sm ring-1 ring-[var(--border-subtle)]"
          >
            SV
          </button>
        </header>

        <div className="grid gap-6 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <section className="space-y-5">
            <div className="rounded-[1.75rem] bg-[var(--charcoal)] p-6 text-white shadow-[0_18px_40px_rgba(30,30,36,0.15)] sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">
                    Your balance
                  </p>
                  <p className="mt-2 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
                    ₹1,240
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
                  October
                </span>
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                <span className="text-white/60">You are owed overall</span>
                <span className="font-extrabold text-[var(--secondary)]">+₹1,240</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[var(--status-owe-bg)] p-4">
                <span className="text-xl">↗</span>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">You owe</p>
                <p className="mt-1 text-xl font-extrabold text-[var(--primary)]">₹360</p>
              </div>
              <div className="rounded-2xl bg-[var(--status-receive-bg)] p-4">
                <span className="text-xl text-[var(--status-receive)]">↙</span>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Owes you</p>
                <p className="mt-1 text-xl font-extrabold text-[var(--status-receive)]">₹1,600</p>
              </div>
            </div>

            <section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-[0_10px_30px_rgba(75,52,45,0.05)] sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Activity</p>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight">Recent expenses</h2>
                </div>
                <button className="text-sm font-bold text-[var(--primary)]">See all</button>
              </div>
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div className="flex items-center gap-3" key={expense.title}>
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-lg ${expense.tone === "coral" ? "bg-[var(--status-owe-bg)]" : expense.tone === "yellow" ? "bg-[var(--accent-yellow-light)]" : "bg-[var(--status-receive-bg)]"}`}>
                      {expense.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{expense.title}</p>
                      <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{expense.meta}</p>
                    </div>
                    <p className="text-sm font-extrabold">{expense.amount}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <aside className="hidden rounded-[1.5rem] bg-[var(--surface-card)] p-6 shadow-[0_10px_30px_rgba(75,52,45,0.05)] lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Your group</p>
            <h2 className="mt-1 text-xl font-extrabold">Room 304 Boys</h2>
            <div className="mt-6 flex -space-x-2">
              {["SV", "RV", "AK", "PK"].map((initials, index) => (
                <div className={`flex size-10 items-center justify-center rounded-full border-2 border-white text-xs font-extrabold ${index === 0 ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-cream)] text-[var(--text-secondary)]"}`} key={initials}>
                  {initials}
                </div>
              ))}
              <div className="flex size-10 items-center justify-center rounded-full border-2 border-white bg-[var(--charcoal)] text-xs font-bold text-white">+3</div>
            </div>
            <button className="mt-8 w-full rounded-full border border-[var(--border-subtle)] py-3 text-sm font-bold text-[var(--charcoal)]">
              View group details
            </button>
          </aside>
        </div>
      </div>

      <Link href="/add-expense" className="fixed bottom-20 right-5 flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(240,93,72,0.3)] transition hover:bg-[var(--primary-dark)] sm:bottom-8 sm:right-8">
        <span className="text-xl leading-none">+</span>
        Add expense
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-subtle)] bg-[var(--surface-card)]/95 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around text-[11px] font-bold text-[var(--text-secondary)]">
          <button className="flex flex-col items-center gap-1.5 text-[var(--primary)]"><span className="text-lg">⌂</span>Home</button>
          <button className="flex flex-col items-center gap-1.5"><span className="text-lg">◫</span>Activity</button>
          <button className="flex flex-col items-center gap-1.5"><span className="text-lg">◉</span>Balances</button>
          <button className="flex flex-col items-center gap-1.5"><span className="text-lg">☻</span>Profile</button>
        </div>
      </nav>
    </main>
  );
}
import Link from "next/link";
