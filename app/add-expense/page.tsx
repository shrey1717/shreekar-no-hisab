"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/src/lib/api-client";

type Group = { id: string; name: string };
type Member = { id: string; name: string; role: string };

const colors = ["bg-[#e9e8f7]", "bg-[#f8e4d7]", "bg-[#dcefe8]", "bg-[#f4e3b2]"];

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function AddExpenseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedGroupId = searchParams.get("groupId");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState(requestedGroupId ?? "");
  const [members, setMembers] = useState<Member[]>([]);
  const [payerId, setPayerId] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setExpenseDate(today()), 0);
    return () => window.clearTimeout(timer);
  }, []);

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
    apiRequest<{ members: Member[] }>(`/api/groups/${groupId}/members`)
      .then((response) => {
        setMembers(response.members);
        setPayerId((current) => current || response.members[0]?.id || "");
        setParticipants(response.members.map((member) => member.id));
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load group members."))
      .finally(() => setLoading(false));
  }, [groupId]);

  const selectedGroup = groups.find((group) => group.id === groupId);
  const participantMembers = members.filter((member) => participants.includes(member.id));
  const amountMinor = Math.round(Number(amount) * 100);
  const customTotal = participantMembers.reduce((total, member) => total + Math.round(Number(customShares[member.id] || 0) * 100), 0);

  function toggleParticipant(id: string) {
    setParticipants((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!groupId || !title.trim() || !Number.isFinite(amountMinor) || amountMinor <= 0 || !payerId || participants.length === 0) {
      setError("Enter an amount, title, payer, and at least one participant.");
      return;
    }
    if (!participants.includes(payerId)) {
      setError("The payer must be included in the split.");
      return;
    }
    if (splitMode === "custom" && customTotal !== amountMinor) {
      setError("Custom shares must equal the total amount.");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          amountMinor: String(amountMinor),
          payerId,
          participantIds: splitMode === "equal" ? participants : undefined,
          splits: splitMode === "custom" ? participants.map((id) => ({
            userId: id,
            shareMinor: String(Math.round(Number(customShares[id] || 0) * 100)),
          })) : undefined,
          splitType: splitMode,
          expenseDate,
        }),
      });
      router.push(`/balances?groupId=${groupId}`);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Could not save the expense.");
    } finally {
      setSaving(false);
    }
  }

  const memberOptions = useMemo(() => members.map((member, index) => ({
    ...member,
    initials: initials(member.name),
    color: colors[index % colors.length],
  })), [members]);

  return (
    <main className="min-h-screen bg-[var(--background)] pb-8">
      <header className="mx-auto flex h-20 w-full max-w-2xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Back to dashboard" className="flex size-10 items-center justify-center rounded-full text-xl text-[var(--charcoal)] transition hover:bg-[var(--surface-card)]">←</Link>
          <div><p className="text-lg font-extrabold tracking-tight">Add expense</p><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">{selectedGroup?.name ?? "Your group"}</p></div>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-card)] text-sm font-extrabold text-[var(--primary)] shadow-sm ring-1 ring-[var(--border-subtle)]">₹</div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 sm:px-8">
        {groups.length > 1 && <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="mb-4 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 text-sm font-bold"><option value="" disabled>Select a group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>}
        {loading && <p className="mb-4 text-sm text-[var(--text-secondary)]">Loading group members...</p>}
        <form className="space-y-4" onSubmit={saveExpense}>
          <section className="relative overflow-hidden rounded-[1.75rem] bg-[var(--charcoal)] p-6 text-white shadow-[0_18px_40px_rgba(30,30,36,0.15)] sm:p-8">
            <label htmlFor="amount" className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">Amount spent</label>
            <div className="mt-4 flex items-center gap-2 border-b border-white/15 pb-3"><span className="text-3xl font-extrabold text-[var(--secondary)]">₹</span><input id="amount" required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="w-full bg-transparent text-4xl font-extrabold tracking-[-0.04em] text-white outline-none placeholder:text-white/25" /></div>
            <label htmlFor="title" className="mt-6 block text-xs font-bold uppercase tracking-[0.12em] text-white/60">What was it for?</label>
            <input id="title" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Groceries, dinner..." className="mt-3 w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[var(--secondary)]" />
            <label htmlFor="expense-date" className="mt-6 block text-xs font-bold uppercase tracking-[0.12em] text-white/60">Date</label>
            <input id="expense-date" required type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} className="mt-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white outline-none" />
          </section>

          <section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6">
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]" htmlFor="payer">Paid by</label>
            <select id="payer" value={payerId} onChange={(event) => setPayerId(event.target.value)} className="mt-3 w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-4 py-3 text-sm font-bold text-[var(--charcoal)] outline-none focus:border-[var(--primary)]"><option value="" disabled>Select payer</option>{memberOptions.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
          </section>

          <section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Split between</p><h2 className="mt-1 text-lg font-extrabold">Who was involved?</h2></div><span className="rounded-full bg-[var(--status-receive-bg)] px-2.5 py-1 text-xs font-bold text-[var(--status-receive)]">{participants.length} people</span></div>
            {memberOptions.length === 0 ? <p className="mt-5 rounded-xl bg-[var(--surface-cream)] p-4 text-sm text-[var(--text-secondary)]">No group members found.</p> : <div className="mt-5 grid grid-cols-4 gap-2">{memberOptions.map((member) => { const selected = participants.includes(member.id); return <button type="button" key={member.id} onClick={() => toggleParticipant(member.id)} className="flex flex-col items-center gap-2"><span className={`flex size-12 items-center justify-center rounded-full text-xs font-extrabold ring-2 ring-offset-2 transition ${member.color} ${selected ? "ring-[var(--primary)]" : "ring-transparent opacity-45"}`}>{member.initials}</span><span className={`text-xs font-bold ${selected ? "text-[var(--charcoal)]" : "text-[var(--text-secondary)]"}`}>{member.name}</span></button>; })}</div>}
          </section>

          <section className="rounded-[1.5rem] bg-[var(--surface-card)] p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Split mode</p><h2 className="mt-1 text-lg font-extrabold">How should it be split?</h2></div><span className="text-xl">⚖</span></div>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-cream)] p-1">{(["equal", "custom"] as const).map((mode) => <button type="button" key={mode} onClick={() => setSplitMode(mode)} className={`rounded-lg py-2.5 text-sm font-extrabold capitalize transition ${splitMode === mode ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}>{mode} split</button>)}</div>
            {splitMode === "custom" && <div className="mt-4 space-y-2">{participantMembers.map((member) => <label key={member.id} className="flex items-center justify-between gap-3 text-sm font-bold"><span>{member.name}</span><span className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-cream)] px-3"><span>₹</span><input required inputMode="decimal" value={customShares[member.id] ?? ""} onChange={(event) => setCustomShares((current) => ({ ...current, [member.id]: event.target.value }))} className="w-24 bg-transparent px-2 py-2 text-right outline-none" placeholder="0.00" /></span></label>)}</div>}
          </section>

          {error && <p role="alert" className="rounded-xl bg-[var(--status-owe-bg)] p-4 text-sm font-bold text-[var(--primary)]">{error}</p>}
          <button disabled={saving || loading} type="submit" className="w-full rounded-full bg-[var(--primary)] py-4 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(240,93,72,0.25)] transition hover:bg-[var(--primary-dark)] disabled:opacity-60">{saving ? "Saving..." : "Save expense"}</button>
        </form>
      </div>
    </main>
  );
}

export default function AddExpense() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm font-bold text-[var(--text-secondary)]">Loading expense form...</main>}>
      <AddExpenseForm />
    </Suspense>
  );
}
