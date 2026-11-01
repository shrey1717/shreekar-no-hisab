"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiRequest } from "@/src/lib/api-client";

type Group = { id: string; name: string };
type Summary = { currency: string; expense_count: number; total_expense_minor: string; member_count: number; confirmed_settlement_count: number; confirmed_settlement_minor: string };
type Category = { category: string; expense_count: number; total_minor: string };
type HistoryItem = { id: string; type: string; title: string; amount_minor: string; status: string; actor_name: string; occurred_at: string };

const money = (minor: string) => `₹${(Number(minor) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ReportsContent() {
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState(searchParams.get("groupId") ?? "");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ groups: Group[] }>("/api/groups").then((response) => {
      setGroups(response.groups);
      setGroupId((current) => current || response.groups[0]?.id || "");
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load groups."));
  }, []);

  useEffect(() => {
    if (!groupId) return;
    Promise.all([
      apiRequest<{ summary: Summary }>(`/api/groups/${groupId}/reports/summary`),
      apiRequest<{ categories: Category[] }>(`/api/groups/${groupId}/reports/categories`),
      apiRequest<{ history: HistoryItem[] }>(`/api/groups/${groupId}/history?limit=20`),
    ]).then(([summaryResponse, categoryResponse, historyResponse]) => {
      setSummary(summaryResponse.summary);
      setCategories(categoryResponse.categories);
      setHistory(historyResponse.history);
      setError("");
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load reports."))
      .finally(() => setLoading(false));
  }, [groupId]);

  const selectedGroup = groups.find((group) => group.id === groupId);

  return (
    <main className="min-h-screen bg-[var(--background)] pb-10">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3"><Link href="/" aria-label="Back to dashboard" className="flex size-10 items-center justify-center rounded-full text-xl text-[var(--charcoal)]">←</Link><div><p className="text-lg font-extrabold">Reports</p><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">{selectedGroup?.name ?? "Your group"}</p></div></div>
        {groups.length > 1 && <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-xs font-bold">{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>}
      </header>
      <div className="mx-auto max-w-6xl space-y-6 px-5 sm:px-8">
        {error && <p role="alert" className="rounded-xl bg-[var(--status-owe-bg)] p-4 text-sm font-bold text-[var(--primary)]">{error}</p>}
        {loading && <p className="rounded-xl bg-[var(--surface-card)] p-5 text-sm text-[var(--text-secondary)]">Loading reports...</p>}
        {summary && <section className="grid gap-3 sm:grid-cols-4"><div className="rounded-2xl bg-[var(--charcoal)] p-5 text-white"><p className="text-xs text-white/60">Total spend</p><p className="mt-2 text-2xl font-extrabold">{money(summary.total_expense_minor)}</p></div><div className="rounded-2xl bg-[var(--surface-card)] p-5"><p className="text-xs text-[var(--text-secondary)]">Expenses</p><p className="mt-2 text-2xl font-extrabold">{summary.expense_count}</p></div><div className="rounded-2xl bg-[var(--surface-card)] p-5"><p className="text-xs text-[var(--text-secondary)]">Members</p><p className="mt-2 text-2xl font-extrabold">{summary.member_count}</p></div><div className="rounded-2xl bg-[var(--status-receive-bg)] p-5"><p className="text-xs text-[var(--text-secondary)]">Settled</p><p className="mt-2 text-2xl font-extrabold text-[var(--status-receive)]">{money(summary.confirmed_settlement_minor)}</p></div></section>}
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Breakdown</p><h2 className="mt-1 text-xl font-extrabold">Spending by category</h2><div className="mt-5 space-y-3">{categories.length === 0 && !loading && <p className="rounded-xl bg-[var(--surface-cream)] p-4 text-sm text-[var(--text-secondary)]">No categorized expenses yet.</p>}{categories.map((category) => <div key={category.category} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] p-3"><div><p className="text-sm font-extrabold capitalize">{category.category}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{category.expense_count} expense{category.expense_count === 1 ? "" : "s"}</p></div><p className="text-sm font-extrabold">{money(category.total_minor)}</p></div>)}</div></section><section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">History</p><h2 className="mt-1 text-xl font-extrabold">Recent activity</h2></div><Link href={groupId ? `/groups/room-304-boys?groupId=${groupId}` : "/"} className="text-sm font-bold text-[var(--primary)]">Group</Link></div><div className="mt-5 space-y-3">{history.length === 0 && !loading && <p className="rounded-xl bg-[var(--surface-cream)] p-4 text-sm text-[var(--text-secondary)]">No activity yet.</p>}{history.map((item) => <div key={`${item.type}-${item.id}`} className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] p-3"><div><p className="text-sm font-extrabold">{item.title}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{item.type} by {item.actor_name} · {item.status}</p></div><p className="text-sm font-extrabold">{money(item.amount_minor)}</p></div>)}</div></section></div>
      </div>
    </main>
  );
}

export default function Reports() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm font-bold text-[var(--text-secondary)]">Loading reports...</main>}><ReportsContent /></Suspense>;
}
