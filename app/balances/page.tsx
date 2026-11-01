"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/src/lib/api-client";

type Group = { id: string; name: string };
type Balance = { userId: string; name: string; netMinor: string };
type Suggestion = { fromUserId: string; fromName: string; toUserId: string; toName: string; amountMinor: string };

const colors = ["bg-[#e9e8f7]", "bg-[#f8e4d7]", "bg-[#dcefe8]", "bg-[#f4e3b2]"];
const money = (minor: string) => `₹${(Number(minor) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

function BalancesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedGroupId = searchParams.get("groupId");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState(requestedGroupId ?? "");
  const [currentUserId, setCurrentUserId] = useState("");
  const [balances, setBalances] = useState<Balance[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");

  async function loadBalances(id: string) {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<{ balances: Balance[]; settlementSuggestions: Suggestion[] }>(`/api/groups/${id}/balances`);
      setBalances(response.balances);
      setSuggestions(response.settlementSuggestions);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Could not load balances.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([
      apiRequest<{ groups: Group[] }>("/api/groups"),
      apiRequest<{ user: { id: string } | null }>("/api/auth/me"),
    ]).then(([groupResponse, userResponse]) => {
      setGroups(groupResponse.groups);
      setCurrentUserId(userResponse.user?.id ?? "");
      setGroupId((current) => current || groupResponse.groups[0]?.id || "");
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load your workspace."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { void loadBalances(groupId); }, [groupId]);

  const selectedGroup = groups.find((group) => group.id === groupId);
  const ownBalance = balances.find((balance) => balance.userId === currentUserId);
  const receiving = balances.filter((balance) => Number(balance.netMinor) > 0);
  const owing = balances.filter((balance) => Number(balance.netMinor) < 0);
  const relevantSuggestions = suggestions.filter((suggestion) => suggestion.fromUserId === currentUserId || suggestion.toUserId === currentUserId);

  async function recordSettlement(suggestion: Suggestion) {
    const key = `${suggestion.fromUserId}-${suggestion.toUserId}`;
    setAction(key);
    setError("");
    try {
      const response = await apiRequest<{ settlement: { id: string } }>(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        body: JSON.stringify({
          fromUserId: suggestion.fromUserId,
          toUserId: suggestion.toUserId,
          amountMinor: suggestion.amountMinor,
        }),
      });
      await apiRequest(`/api/groups/${groupId}/settlements/${response.settlement.id}/confirm`, { method: "POST" });
      await loadBalances(groupId);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Could not record settlement.");
    } finally {
      setAction("");
    }
  }

  const displayName = useMemo(() => ownBalance?.name ?? "You", [ownBalance]);

  return (
    <main className="min-h-screen bg-[var(--background)] pb-10">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3"><Link href="/" aria-label="Back to dashboard" className="flex size-10 items-center justify-center rounded-full text-xl text-[var(--charcoal)] transition hover:bg-[var(--surface-card)]">←</Link><div><p className="text-lg font-extrabold tracking-tight">Balances</p><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">{selectedGroup?.name ?? "Your group"}</p></div></div>
        <Link href={groupId ? `/add-expense?groupId=${groupId}` : "/add-expense"} className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-extrabold text-white">Add expense</Link>
      </header>
      <div className="mx-auto mb-6 w-full max-w-6xl px-5 sm:px-8">
        {groups.length > 1 && <select value={groupId} onChange={(event) => { setGroupId(event.target.value); router.replace(`/balances?groupId=${event.target.value}`); }} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 text-sm font-bold"><option value="" disabled>Select a group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>}
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <section aria-labelledby="balance-heading" className="relative overflow-hidden rounded-[1.75rem] bg-[var(--charcoal)] p-6 text-white shadow-[0_18px_40px_rgba(30,30,36,0.15)] sm:p-8">
            <span className="rounded-full bg-[var(--status-receive)]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--status-receive)]">Net summary</span>
            <p id="balance-heading" className="mt-7 text-xs font-bold uppercase tracking-[0.12em] text-white/55">{Number(ownBalance?.netMinor ?? 0) >= 0 ? "You should receive" : "You owe others"}</p>
            <p className="mt-2 text-4xl font-extrabold tracking-[-0.04em]">{money(String(Math.abs(Number(ownBalance?.netMinor ?? 0))))}</p>
            <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4 text-sm"><span className="text-white/60">{displayName}&apos;s current balance</span><span className={Number(ownBalance?.netMinor ?? 0) >= 0 ? "font-extrabold text-[var(--status-receive)]" : "font-extrabold text-[var(--primary)]"}>{Number(ownBalance?.netMinor ?? 0) >= 0 ? "Receive" : "Pay"}</span></div>
          </section>
          <section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Group balances</p><h1 className="mt-1 text-xl font-extrabold">Everyone&apos;s position</h1>
            <div className="mt-5 space-y-3">{loading && <p className="rounded-xl bg-[var(--surface-cream)] p-4 text-sm text-[var(--text-secondary)]">Loading balances...</p>}{!loading && balances.length === 0 && <p className="rounded-xl bg-[var(--surface-cream)] p-4 text-sm text-[var(--text-secondary)]">No balances yet. Add an expense first.</p>}{balances.map((balance, index) => <div key={balance.userId} className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] p-3"><div className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${colors[index % colors.length]}`}>{initials(balance.name)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{balance.userId === currentUserId ? `${balance.name} (you)` : balance.name}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{Number(balance.netMinor) >= 0 ? "Should receive" : "Owes the group"}</p></div><p className={`text-sm font-extrabold ${Number(balance.netMinor) >= 0 ? "text-[var(--status-receive)]" : "text-[var(--primary)]"}`}>{money(String(Math.abs(Number(balance.netMinor))))}</p></div>)}</div>
          </section>
        </div>
        <aside className="space-y-5">
          <section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Settle up</p><h2 className="mt-1 text-xl font-extrabold">{relevantSuggestions.length ? "Suggested repayments" : "Nothing to settle yet"}</h2><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{relevantSuggestions.length ? "Record a suggested payment to update the group balance." : "Add people and expenses first. Settlement suggestions will appear here when balances exist."}</p><div className="mt-5 space-y-3">{relevantSuggestions.map((suggestion) => { const key = `${suggestion.fromUserId}-${suggestion.toUserId}`; return <div key={key} className="rounded-2xl border border-[var(--border-subtle)] p-4"><p className="text-sm font-extrabold">{suggestion.fromUserId === currentUserId ? "You" : suggestion.fromName} <span className="font-normal text-[var(--text-secondary)]">pay</span> {suggestion.toUserId === currentUserId ? "you" : suggestion.toName}</p><p className="mt-1 text-lg font-extrabold text-[var(--primary)]">{money(suggestion.amountMinor)}</p><button disabled={action === key} onClick={() => void recordSettlement(suggestion)} className="mt-3 w-full rounded-full bg-[var(--primary)] py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{action === key ? "Recording..." : "Mark as settled"}</button></div>; })}</div></section>
          <section className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-transparent p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Good to know</p><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Balances use active expenses and confirmed repayments. Recording a suggestion creates and confirms a settlement.</p></section>
          {error && <p role="alert" className="rounded-xl bg-[var(--status-owe-bg)] p-4 text-sm font-bold text-[var(--primary)]">{error}</p>}
        </aside>
      </div>
    </main>
  );
}

export default function Balances() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm font-bold text-[var(--text-secondary)]">Loading balances...</main>}><BalancesContent /></Suspense>;
}
