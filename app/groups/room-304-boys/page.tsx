"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/src/lib/api-client";

type Group = { id: string; name: string; description: string | null; currency: string };
type Member = { id: string; name: string; role: string };
type Expense = { id: string; title: string; amount_minor: string; payer_name: string; expense_date: string; category: string | null; status: string };

const colors = ["bg-[#e9e8f7]", "bg-[#f8e4d7]", "bg-[#dcefe8]", "bg-[#f4e3b2]"];
const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const money = (minor: string) => `₹${(Number(minor) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function GroupDetailsContent() {
  const searchParams = useSearchParams();
  const requestedGroupId = searchParams.get("groupId");
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [groupId, setGroupId] = useState(requestedGroupId ?? "");
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  useEffect(() => {
    apiRequest<{ groups: Array<{ id: string; name: string }> }>("/api/groups")
      .then((response) => {
        setGroups(response.groups);
        setGroupId((current) => current || response.groups[0]?.id || "");
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load groups."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    setError("");
    Promise.all([
      apiRequest<{ group: Group }>(`/api/groups/${groupId}`),
      apiRequest<{ members: Member[] }>(`/api/groups/${groupId}/members`),
      apiRequest<{ expenses: Expense[] }>(`/api/groups/${groupId}/expenses`),
    ]).then(([groupResponse, memberResponse, expenseResponse]) => {
      setGroup(groupResponse.group);
      setMembers(memberResponse.members);
      setExpenses(expenseResponse.expenses);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load group details."))
      .finally(() => setLoading(false));
  }, [groupId]);

  const totalSpend = expenses.reduce((sum, expense) => sum + Number(expense.amount_minor), 0);
  const visibleExpenses = expenses;
  const selectedGroupName = group?.name ?? groups.find((item) => item.id === groupId)?.name ?? "Your group";
  const memberCountLabel = `${members.length} active member${members.length === 1 ? "" : "s"}`;

  async function createInvite() {
    setError("");
    try {
      const response = await apiRequest<{ invitation: { token: string; url: string } }>(`/api/groups/${groupId}/invite`, {
        method: "POST",
        body: JSON.stringify({ expiresInDays: 7, maxUses: 20 }),
      });
      const url = `${window.location.origin}${response.invitation.url}`;
      setInviteUrl(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Could not create an invitation.");
    }
  }

  const memberView = useMemo(() => members.map((member, index) => ({ ...member, color: colors[index % colors.length] })), [members]);

  return (
    <main className="min-h-screen bg-[var(--background)] pb-10">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3"><Link href="/" aria-label="Back to dashboard" className="flex size-10 items-center justify-center rounded-full text-xl text-[var(--charcoal)] transition hover:bg-[var(--surface-card)]">←</Link><div><p className="text-lg font-extrabold tracking-tight">Group details</p><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">PaisaNakhne</p></div></div>
        {groups.length > 1 && <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-xs font-bold">{groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <section aria-labelledby="group-heading" className="relative overflow-hidden rounded-[1.75rem] bg-[var(--surface-card)] p-6 shadow-sm sm:p-8">
            <div className="relative"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--status-owe-bg)] text-2xl">🏠</div><div><h1 id="group-heading" className="text-xl font-extrabold tracking-tight">{selectedGroupName}</h1><p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]"><span className="size-1.5 rounded-full bg-[var(--status-receive)]" />{memberCountLabel}</p></div></div></div>
              <div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[var(--charcoal)] p-4 text-white"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/55">Group spend</p><p className="mt-2 text-2xl font-extrabold">{money(String(totalSpend))}</p><p className="mt-1 text-xs text-white/50">All active expenses</p></div><div className="rounded-2xl bg-[var(--status-receive-bg)] p-4"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">Expenses</p><p className="mt-2 text-2xl font-extrabold text-[var(--status-receive)]">{expenses.length}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Recorded entries</p></div></div>
              <div className="mt-5 flex gap-2"><Link href={groupId ? `/add-expense?groupId=${groupId}` : "/add-expense"} className="flex-1 rounded-full bg-[var(--primary)] py-3 text-center text-sm font-extrabold text-white">Add expense</Link><button type="button" onClick={() => void createInvite()} className="rounded-full border border-[var(--border-subtle)] px-4 py-3 text-center text-sm font-extrabold text-[var(--charcoal)]">{copied ? "Copied!" : "Invite"}</button></div>
              {inviteUrl && <p className="mt-3 break-all rounded-xl bg-[var(--surface-cream)] p-3 text-xs text-[var(--text-secondary)]">{inviteUrl}</p>}
            </div>
          </section>
          <section aria-labelledby="members-heading" className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">People</p><h2 id="members-heading" className="mt-1 text-xl font-extrabold">Group members</h2><div className="mt-5 space-y-3">{memberView.length === 0 && <p className="rounded-xl bg-[var(--surface-cream)] p-4 text-sm text-[var(--text-secondary)]">No members added yet.</p>}{memberView.map((member) => <div key={member.id} className="flex items-center gap-3"><div className={`flex size-10 items-center justify-center rounded-full text-xs font-extrabold ${member.color}`}>{initials(member.name)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{member.name}</p><p className="mt-0.5 text-xs capitalize text-[var(--text-secondary)]">{member.role}</p></div></div>)}</div></section>
        </div>
        <section aria-labelledby="activity-heading" className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Ledger</p><h2 id="activity-heading" className="mt-1 text-xl font-extrabold">Group activity</h2></div><div className="flex gap-3"><Link href={groupId ? `/reports?groupId=${groupId}` : "/reports"} className="rounded px-1 text-sm font-bold text-[var(--primary)]">Reports</Link><Link href={groupId ? `/balances?groupId=${groupId}` : "/balances"} className="rounded px-1 text-sm font-bold text-[var(--primary)]">Balances</Link></div></div><div className="mt-5 space-y-3">{loading && <p className="rounded-xl bg-[var(--surface-cream)] p-4 text-sm text-[var(--text-secondary)]">Loading group activity...</p>}{!loading && visibleExpenses.length === 0 && <p className="rounded-xl bg-[var(--surface-cream)] p-4 text-sm text-[var(--text-secondary)]">No expenses recorded yet. Add your first expense to see it here.</p>}{visibleExpenses.map((expense) => <div key={expense.id} className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] p-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-cream)] text-lg">₹</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{expense.title}</p><p className="mt-1 truncate text-xs text-[var(--text-secondary)]">Paid by {expense.payer_name}</p></div><div className="text-right"><p className="text-sm font-extrabold">{money(expense.amount_minor)}</p><p className="mt-1 text-[11px] font-semibold text-[var(--text-secondary)]">{expense.expense_date}</p></div></div>)}</div>{error && <p role="alert" className="mt-5 rounded-xl bg-[var(--status-owe-bg)] p-4 text-sm font-bold text-[var(--primary)]">{error}</p>}</section>
      </div>
    </main>
  );
}

export default function GroupDetails() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm font-bold text-[var(--text-secondary)]">Loading group...</main>}><GroupDetailsContent /></Suspense>;
}
